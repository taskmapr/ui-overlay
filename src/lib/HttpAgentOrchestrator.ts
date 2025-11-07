import { 
  AgentOrchestrator, 
  AgentContextPackage, 
  AgentOrchestratorResponse,
  StreamingCallbacks
} from './agentOrchestrator';
import { Message } from '../types';

/**
 * HTTP-based Agent Orchestrator with SSE streaming support
 * Sends context to a streaming endpoint and handles Server-Sent Events
 * 
 * @example
 * ```typescript
 * const orchestrator = new HttpAgentOrchestrator('http://localhost:8000/api/taskmapr/orchestrate', {
 *   getAccessToken: () => yourSupabaseToken,
 *   timeout: 60000
 * });
 * 
 * const client = createTaskMaprClient('http://localhost:8000/api/taskmapr/orchestrate', {
 *   orchestrator: {
 *     orchestrator,
 *     includeDomSnapshots: true
 *   }
 * });
 * ```
 */
export class HttpAgentOrchestrator implements AgentOrchestrator {
  private endpoint: string;
  private getAccessToken?: () => string | null | undefined;
  private timeout: number;

  constructor(
    endpoint: string, 
    options?: { 
      apiKey?: string; 
      getAccessToken?: () => string | null | undefined;
      timeout?: number;
    }
  ) {
    this.endpoint = endpoint;
    this.getAccessToken = options?.getAccessToken;
    // Fallback to apiKey if getAccessToken not provided
    if (!this.getAccessToken && options?.apiKey) {
      this.getAccessToken = () => options.apiKey!;
    }
    this.timeout = options?.timeout || 60000; // Longer timeout for streaming
  }

  async orchestrate(
    context: AgentContextPackage,
    callbacks?: StreamingCallbacks
  ): Promise<AgentOrchestratorResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Prepare request body - serialize timestamp as ISO string
      const requestBody = {
        prompt: context.prompt,
        history: context.history.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
          ...(msg.highlight && { highlight: msg.highlight }),
        })),
        domElements: context.domElements.map(el => ({
          id: el.id,
          tagName: el.tagName,
          textContent: el.textContent,
          classNames: el.classNames,
          role: el.role,
          ariaLabel: el.ariaLabel,
          ariaDescribedBy: el.ariaDescribedBy,
          placeholder: el.placeholder,
          value: el.value,
          type: el.type,
          position: el.position,
          isInteractive: el.isInteractive,
        })),
        pageContext: context.pageContext,
        timestamp: context.timestamp instanceof Date 
          ? context.timestamp.toISOString() 
          : context.timestamp,
        ...(context.walkthroughContext && { walkthroughContext: context.walkthroughContext }),
        ...(context.customContext && { customContext: context.customContext }),
        ...(context.sessionId && { sessionId: context.sessionId }),
      };

      // Get auth token
      const authToken = this.getAccessToken?.();

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `Agent request failed: ${response.status} ${response.statusText}\n${errorText}`;
        callbacks?.onError?.(errorMsg);
        throw new Error(errorMsg);
      }

      // Check if response is SSE (text/event-stream)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        return await this.handleSSEStream(response, callbacks, controller);
      }

      // Fallback to JSON response (non-streaming)
      const data = await response.json();

      // Convert response to expected format
      const message: Message = {
        id: data.id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || data.message || '',
        timestamp: new Date(data.timestamp || Date.now()),
        highlight: data.highlight,
      };

      return {
        message,
        actions: data.actions,
        metadata: data.metadata,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const errorMsg = `Agent request timeout after ${this.timeout}ms`;
          callbacks?.onError?.(errorMsg);
          throw new Error(errorMsg);
        }
        callbacks?.onError?.(error.message);
        throw error;
      }
      
      const errorMsg = 'Unknown error during agent orchestration';
      callbacks?.onError?.(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async handleSSEStream(
    response: Response,
    callbacks: StreamingCallbacks | undefined,
    controller: AbortController
  ): Promise<AgentOrchestratorResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let sessionId: string | undefined;
    let messageId = `assistant-${Date.now()}`;
    const actions: any[] = [];
    let metadata: Record<string, any> | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        if (controller.signal.aborted) {
          reader.cancel();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]' || !dataStr) {
              continue;
            }

            try {
              const eventData = JSON.parse(dataStr);
              const eventType = eventData.event;
              const eventPayload = eventData.data || {};

              switch (eventType) {
                case 'text_delta':
                  const text = eventPayload.text || '';
                  fullContent += text;
                  callbacks?.onTextDelta?.(text);
                  break;

                case 'reasoning_start':
                  callbacks?.onReasoningStart?.();
                  break;

                case 'reasoning_delta':
                  callbacks?.onReasoningDelta?.(eventPayload.text || '');
                  break;

                case 'reasoning_done':
                  callbacks?.onReasoningDone?.();
                  break;

                case 'tool_call_started':
                  callbacks?.onToolCallStarted?.(eventPayload.tool_name || 'unknown');
                  break;

                case 'tool_call_completed':
                  callbacks?.onToolCallCompleted?.(eventPayload.tool_name || 'unknown');
                  break;

                case 'actions':
                  if (Array.isArray(eventPayload.actions)) {
                    actions.push(...eventPayload.actions);
                    callbacks?.onActions?.(eventPayload.actions);
                  }
                  break;

                case 'metadata':
                  metadata = eventPayload;
                  callbacks?.onMetadata?.(eventPayload);
                  break;

                case 'error':
                  const errorMsg = eventPayload.message || 'Unknown error';
                  callbacks?.onError?.(errorMsg);
                  throw new Error(errorMsg);

                case 'complete':
                  sessionId = eventPayload.sessionId;
                  callbacks?.onComplete?.(sessionId);
                  break;

                case 'heartbeat':
                  // Ignore heartbeat events
                  break;

                default:
                  console.warn('Unknown SSE event type:', eventType);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', dataStr, parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Return final message with accumulated content
    const message: Message = {
      id: messageId,
      role: 'assistant',
      content: fullContent || 'No response received',
      timestamp: new Date(),
    };

    return {
      message,
      actions: actions.length > 0 ? actions : undefined,
      metadata,
    };
  }
}



