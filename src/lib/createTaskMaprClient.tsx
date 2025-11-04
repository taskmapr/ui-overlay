import { TaskMaprClient, TaskMaprClientOptions, Message, AgentFramework } from '../types';
import { TaskMaprProvider } from '../contexts/TaskMaprContext';
import { SelfContainedOverlay } from '../components/SelfContainedOverlay';
import { collectAgentContext } from './contextCollector';
import { AgentOrchestratorResponse } from './agentOrchestrator';

const DEFAULT_OPTIONS: Partial<TaskMaprClientOptions> = {
  framework: 'openai-agents' as AgentFramework,
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000,
  mockMode: false,
  retry: {
    attempts: 3,
    backoff: 1000,
  },
  overlay: {
    title: 'AI Assistant',
    placeholder: 'Ask me anything...',
    showTimestamps: true,
    enableHighlighting: true,
    position: 'bottom-right' as const,
  },
};

interface NormalizedAssistantPayload {
  id?: string;
  content: string;
  timestamp?: string | number | Date;
  highlight?: Message['highlight'];
}

/** 
 * Create a TaskMapr client to interact with your AI agent backend
 * 
 * @param agentEndpoint - URL where your agent backend is hosted
 * @param options - Configuration options for the client
 * 
 * @example
 * ```typescript
 * const taskmapr = createTaskMaprClient(
 *   'http://localhost:8000/api/agent',
 *   {
 *     apiKey: process.env.VITE_OPENAI_API_KEY,
 *     model: 'gpt-4o',
 *     framework: 'openai-agents',
 *     overlay: {
 *       title: 'Demo Chat',
 *       showTimestamps: true
 *     }
 *   }
 * );
 * 
 * // Send a message
 * const response = await taskmapr.sendMessage('Help me navigate');
 * ```
 */
export function createTaskMaprClient(
  agentEndpoint: string,
  options: TaskMaprClientOptions = {}
): TaskMaprClient {
  // Allow empty endpoint if mockMode is enabled
  if (!agentEndpoint && !options.mockMode) {
    console.warn('TaskMapr: No agentEndpoint provided and mockMode not enabled. Enabling mockMode automatically.');
  }

  // Merge options with defaults
  let config: TaskMaprClientOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    retry: {
      attempts: options.retry?.attempts ?? DEFAULT_OPTIONS.retry?.attempts ?? 3,
      backoff: options.retry?.backoff ?? DEFAULT_OPTIONS.retry?.backoff ?? 1000,
    },
    overlay: {
      ...DEFAULT_OPTIONS.overlay,
      ...options.overlay,
      ...(options.overlay?.theme && {
        theme: {
          ...options.overlay.theme,
        },
      }),
    },
  };

  // Track message history for orchestrator
  const messageHistory: Message[] = [];
  
  // Track session ID for conversation continuity
  let currentSessionId: string | undefined;

  /**
   * Send a message to the agent and get a response
   */
  async function sendMessage(
    message: string,
    context?: Record<string, any>
  ): Promise<Message> {
    // Create user message and add to history
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    messageHistory.push(userMessage);

    // Call onMessageSent callback if provided
    config.onMessageSent?.(userMessage);

    try {
      let assistantMessage: Message;
      let finalUpdateSent = false; // Track if final update was sent (for streaming)

      // Priority 1: Use Agent Orchestrator if configured
      if (config.orchestrator) {
        const orchestratorConfig = config.orchestrator;
        
        // Collect complete context for orchestrator
        const contextPackage = collectAgentContext(
          message,
          messageHistory,
          {
            includeDomSnapshots: orchestratorConfig.includeDomSnapshots ?? true,
            historyLimit: orchestratorConfig.historyLimit,
            getCustomContext: () => ({
              ...context,
              ...(config.getContext?.() || {}),
            }),
          }
        );
        
        // Add sessionId to context if we have one
        if (currentSessionId) {
          contextPackage.sessionId = currentSessionId;
        }

        // Transform context if custom transformer provided
        const finalContext = orchestratorConfig.transformContext
          ? orchestratorConfig.transformContext(contextPackage)
          : contextPackage;

        // Create streaming message early for real-time updates
        let streamingMessageId = `assistant-${Date.now()}`;
        let streamingContent = '';
        assistantMessage = {
          id: streamingMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        
        // Add placeholder message immediately for streaming
        messageHistory.push(assistantMessage);
        
        // Notify listeners about the placeholder message so UI can show it immediately
        if (config.onMessageReceived) {
          config.onMessageReceived(assistantMessage);
        }

        // Throttle streaming updates for smooth animation
        let rafId: number | null = null;
        let pendingUpdate: Message | null = null;
        let lastSentContent = ''; // Track last sent content to avoid duplicate sends
        
        const flushUpdate = () => {
          if (pendingUpdate && config.onMessageReceived) {
            // Only send if content has actually changed
            if (pendingUpdate.content !== lastSentContent) {
              config.onMessageReceived(pendingUpdate);
              lastSentContent = pendingUpdate.content;
            }
            pendingUpdate = null;
          }
          rafId = null;
        };

        // Set up streaming callbacks
        const streamingCallbacks = {
          onTextDelta: (text: string) => {
            streamingContent += text;
            
            // Remove [ACTIONS] blocks from the displayed content (but keep them in full_response_text for extraction)
            const actionsBlockPattern = /\[ACTIONS\](.*?)\[\/ACTIONS\]/gis;
            const cleanedContent = streamingContent.replace(actionsBlockPattern, '').trim();
            
            // Update the message in history
            const index = messageHistory.findIndex(m => m.id === streamingMessageId);
            if (index >= 0) {
              const updatedMessage: Message = {
                ...messageHistory[index],
                content: cleanedContent,
              };
              messageHistory[index] = updatedMessage;
              
              // Use requestAnimationFrame for smoother updates
              pendingUpdate = updatedMessage;
              if (!rafId) {
                rafId = requestAnimationFrame(() => {
                  flushUpdate();
                  rafId = null;
                });
              }
            }
          },
          onReasoningStart: () => {
            console.log('[TaskMapr] Reasoning started');
          },
          onReasoningDelta: (text: string) => {
            console.log('[TaskMapr] Reasoning:', text);
          },
          onReasoningDone: () => {
            console.log('[TaskMapr] Reasoning done');
          },
          onToolCallStarted: (toolName: string) => {
            console.log('[TaskMapr] Tool call started:', toolName);
          },
          onToolCallCompleted: (toolName: string) => {
            console.log('[TaskMapr] Tool call completed:', toolName);
          },
          onActions: (actions: any[]) => {
            console.log('[TaskMapr] Actions received:', actions);
            
            // Execute actions if handlers are provided
            if (config.actionHandlers && actions && actions.length > 0) {
              actions.forEach((action: any) => {
                try {
                  switch (action.type) {
                    case 'navigate':
                      if (action.payload?.path && config.actionHandlers?.navigate) {
                        console.log('[TaskMapr] Navigating to:', action.payload.path);
                        config.actionHandlers.navigate(action.payload.path);
                      } else if (action.payload?.path) {
                        // Fallback: use window.location if no handler provided
                        console.log('[TaskMapr] Navigating to (fallback):', action.payload.path);
                        window.location.href = action.payload.path;
                      }
                      break;
                      
                    case 'highlight':
                      if (action.payload?.selectors && config.actionHandlers?.highlight) {
                        console.log('[TaskMapr] Highlighting:', action.payload.selectors);
                        config.actionHandlers.highlight(
                          action.payload.selectors,
                          action.payload.duration
                        );
                      } else {
                        console.warn('[TaskMapr] Highlight action received but no handler configured');
                      }
                      break;
                      
                    case 'scrollTo':
                      if (action.payload?.selector && config.actionHandlers?.scrollTo) {
                        console.log('[TaskMapr] Scrolling to:', action.payload.selector);
                        config.actionHandlers.scrollTo(
                          action.payload.selector,
                          action.payload.behavior
                        );
                      }
                      break;
                      
                    case 'click':
                      if (action.payload?.selector && config.actionHandlers?.click) {
                        console.log('[TaskMapr] Clicking:', action.payload.selector);
                        config.actionHandlers.click(action.payload.selector);
                      }
                      break;
                      
                    default:
                      console.log('[TaskMapr] Unhandled action type:', action.type);
                  }
                } catch (error) {
                  console.error('[TaskMapr] Error executing action:', action, error);
                }
              });
            }
          },
          onMetadata: (metadata: any) => {
            console.log('[TaskMapr] Metadata:', metadata);
          },
          onError: (error: string) => {
            console.error('[TaskMapr] Stream error:', error);
            if (config.onError) {
              config.onError(new Error(error));
            }
          },
          onComplete: (sessionId?: string) => {
            console.log('[TaskMapr] Stream complete, sessionId:', sessionId);
            // Flush any pending update
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
            flushUpdate(); // Flush any pending update
            
            // Send final message update to signal completion
            const index = messageHistory.findIndex(m => m.id === streamingMessageId);
            if (index >= 0 && config.onMessageReceived) {
              const finalMessage = messageHistory[index];
              // Only send final update if content differs from what we last sent
              // This prevents duplicate messages when flushUpdate already sent the final content
              if (finalMessage.content !== lastSentContent) {
                config.onMessageReceived(finalMessage);
                lastSentContent = finalMessage.content;
              }
              finalUpdateSent = true; // Mark that we've sent the final update
            }
            if (sessionId) {
              // Store sessionId for future requests
              currentSessionId = sessionId;
            }
            
            // Send a final message update with streaming complete flag to signal loading should stop
            // This is handled by the overlay component's handleStreamingUpdate
          },
        };

        // Call orchestrator with streaming callbacks
        let orchestratorResponse: AgentOrchestratorResponse;
        try {
          orchestratorResponse = await orchestratorConfig.orchestrator.orchestrate(
            finalContext,
            streamingCallbacks
          );
        } catch (orchestrationError) {
          // Remove the placeholder message on error
          const errorIndex = messageHistory.findIndex(m => m.id === streamingMessageId);
          if (errorIndex >= 0) {
            messageHistory.splice(errorIndex, 1);
          }
          if (orchestratorConfig.onOrchestrationError) {
            orchestratorConfig.onOrchestrationError(
              orchestrationError as Error,
              finalContext
            );
          }
          throw orchestrationError;
        }

        // Transform response if custom transformer provided
        const finalResponse = orchestratorConfig.transformResponse
          ? orchestratorConfig.transformResponse(orchestratorResponse)
          : orchestratorResponse;

        // Update the streaming message with final content
        const finalIndex = messageHistory.findIndex(m => m.id === streamingMessageId);
        if (finalIndex >= 0) {
          // Remove [ACTIONS] blocks from final content
          const actionsBlockPattern = /\[ACTIONS\](.*?)\[\/ACTIONS\]/gis;
          const finalContent = (streamingContent || finalResponse.message.content).replace(actionsBlockPattern, '').trim();
          
          messageHistory[finalIndex] = {
            ...messageHistory[finalIndex],
            ...finalResponse.message,
            content: finalContent,
          };
          assistantMessage = messageHistory[finalIndex];
        } else {
          // Remove [ACTIONS] blocks from final content
          const actionsBlockPattern = /\[ACTIONS\](.*?)\[\/ACTIONS\]/gis;
          const finalContent = finalResponse.message.content.replace(actionsBlockPattern, '').trim();
          assistantMessage = {
            ...finalResponse.message,
            content: finalContent,
          };
          messageHistory.push(assistantMessage);
        }

        // Handle actions from orchestrator response
        if (finalResponse.actions && finalResponse.actions.length > 0) {
          console.log('[TaskMapr] Final response actions:', finalResponse.actions);
          
          // Execute actions using configured handlers
          if (config.actionHandlers) {
            finalResponse.actions.forEach((action: any) => {
              try {
                switch (action.type) {
                  case 'navigate':
                    if (action.payload?.path && config.actionHandlers?.navigate) {
                      config.actionHandlers.navigate(action.payload.path);
                    } else if (action.payload?.path) {
                      window.location.href = action.payload.path;
                    }
                    break;
                  case 'highlight':
                    if (action.payload?.selectors && config.actionHandlers?.highlight) {
                      config.actionHandlers.highlight(
                        action.payload.selectors,
                        action.payload.duration
                      );
                    }
                    break;
                  case 'scrollTo':
                    if (action.payload?.selector && config.actionHandlers?.scrollTo) {
                      config.actionHandlers.scrollTo(
                        action.payload.selector,
                        action.payload.behavior
                      );
                    }
                    break;
                  case 'click':
                    if (action.payload?.selector && config.actionHandlers?.click) {
                      config.actionHandlers.click(action.payload.selector);
                    }
                    break;
                }
              } catch (error) {
                console.error('[TaskMapr] Error executing final action:', action, error);
              }
            });
          }
        }
      }
      // Priority 2: Use mock mode if enabled or no endpoint
      else if (config.mockMode || !agentEndpoint) {
        if (config.mockResponseHandler) {
          assistantMessage = await config.mockResponseHandler(message, context);
        } else {
          // Default mock response
          await new Promise((resolve) => setTimeout(resolve, 1000));
          assistantMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Mock response: Got your message "${message}"\n\n(Configure agent endpoint or orchestrator to connect to a real agent)`,
            timestamp: new Date(),
          };
        }
      }
      // Priority 3: Direct API call (legacy pattern)
      else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        try {
          const mergedContext = {
            ...context,
            ...(config.getContext?.() || {}),
          };

          const response = await fetchWithRetry(agentEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
              ...config.headers,
            },
            body: JSON.stringify({
              message,
              context: mergedContext,
              config: {
                model: config.model,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                instructions: config.instructions,
                framework: config.framework,
              },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Agent API error: ${response.status} ${response.statusText}`);
          }

          const data = await parseAgentApiResponse(response);
          const normalized = normalizeAssistantResponse(data);

          assistantMessage = {
            id: normalized.id || Date.now().toString(),
            role: 'assistant',
            content: normalized.content,
            timestamp: new Date(normalized.timestamp || Date.now()),
            highlight: normalized.highlight,
          };
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              throw new Error(`TaskMapr: Request timeout after ${config.timeout}ms`);
            }
            throw new Error(`TaskMapr: ${error.message}`);
          }
          
          throw error;
        }
      }

        // Note: For streaming, the message is already added to history during streaming
        // Only add it if it wasn't added during streaming
        const alreadyExists = messageHistory.some(m => m.id === assistantMessage.id);
        if (!alreadyExists) {
          messageHistory.push(assistantMessage);
        }

      // Call onMessageReceived callback if provided (final update)
      // For streaming, this was already called in onComplete, so skip to avoid duplicates
      if (config.onMessageReceived && !finalUpdateSent) {
        config.onMessageReceived(assistantMessage);
      }

      return assistantMessage;
    } catch (error) {
      // Call onError callback if provided
      if (config.onError && error instanceof Error) {
        config.onError(error);
      }
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   */
  async function fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (attempt >= (config.retry?.attempts || 1)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = (config.retry?.backoff || 1000) * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      return fetchWithRetry(url, options, attempt + 1);
    }
  }

  /**
   * Parse agent response supporting JSON bodies and SSE streams
   */
  async function parseAgentApiResponse(response: Response): Promise<any> {
    try {
      // Clone before consuming so we can fall back to text parsing
      return await response.clone().json();
    } catch {
      const rawText = await response.text();
      const trimmed = rawText.trim();

      if (!trimmed) {
        return {};
      }

      try {
        return JSON.parse(trimmed);
      } catch {
        const ssePayload = extractPayloadFromSse(trimmed);
        if (ssePayload) {
          return ssePayload;
        }

        throw new Error('Unable to parse agent response (expected JSON or SSE payload).');
      }
    }
  }

  /**
   * Normalise various agent payload shapes into a Message-friendly structure
   */
  function normalizeAssistantResponse(payload: any): NormalizedAssistantPayload {
    if (payload == null) {
      throw new Error('TaskMapr: Agent response was empty');
    }

    if (typeof payload === 'string') {
      const text = payload.trim();
      if (!text) {
        throw new Error('TaskMapr: Agent response did not include any content');
      }
      return { content: text };
    }

    const visited = new WeakSet<object>();
    const queue: any[] = [];
    const topLevelHighlight =
      typeof payload === 'object' && payload !== null
        ? (payload as { highlight?: Message['highlight'] }).highlight
        : undefined;
    const enqueue = (value: any) => {
      if (value == null) {
        return;
      }
      if (typeof value === 'string') {
        const text = value.trim();
        if (text) {
          queue.push({ content: text });
        }
        return;
      }
      if (typeof value === 'object') {
        if (!visited.has(value as object)) {
          visited.add(value as object);
          queue.push(value);
        }
      }
    };

    enqueue(payload);

    let fallback: NormalizedAssistantPayload | null = null;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || typeof current !== 'object') {
        continue;
      }

      const candidateRole = resolveRole(current);
      const candidateContent = stringifyContent(
        current.content ?? current.output_text ?? current.outputText ?? current.text
      ).trim();

      if (candidateContent) {
        const normalised: NormalizedAssistantPayload = {
          id: current.id,
          content: candidateContent,
          timestamp: current.timestamp ?? current.created_at ?? current.createdAt,
          highlight: current.highlight,
        };
        if (!normalised.highlight && topLevelHighlight) {
          normalised.highlight = topLevelHighlight;
        }

        if (
          !candidateRole ||
          candidateRole.includes('assistant') ||
          candidateRole === 'model' ||
          candidateRole === 'message'
        ) {
          return normalised;
        }

        if (!fallback) {
          fallback = normalised;
        }
      }

      const nestedCandidates = [
        current.message,
        current.data,
        current.data?.message,
        current.data?.response,
        current.data?.response?.message,
        current.result,
        current.results,
        current.response,
        current.responses,
        current.payload,
        current.messages,
        current.outputs,
        current.output,
        current.choices,
        current.delta,
        current.event,
      ];

      for (const nested of nestedCandidates) {
        if (Array.isArray(nested)) {
          nested.forEach(enqueue);
        } else {
          enqueue(nested);
        }
      }

      Object.values(current).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(enqueue);
        } else {
          enqueue(value);
        }
      });
    }

    if (fallback) {
      if (!fallback.highlight && topLevelHighlight) {
        fallback.highlight = topLevelHighlight;
      }
      return fallback;
    }

    throw new Error('TaskMapr: Unable to extract assistant content from agent response');
  }

  /**
   * Try to extract the most recent JSON payload from an SSE stream
   */
  function extractPayloadFromSse(rawText: string): any | null {
    const blocks = rawText.split(/\n\n+/);

    for (let i = blocks.length - 1; i >= 0; i -= 1) {
      const block = blocks[i].trim();
      if (!block) {
        continue;
      }

      const dataLines = block
        .split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => line.replace(/^data:\s*/, '').trim())
        .filter(line => line && line !== '[DONE]');

      if (!dataLines.length) {
        continue;
      }

      const candidate = dataLines.join('\n');

      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Convert a variety of content payload shapes into string form
   */
  function stringifyContent(value: unknown, visited = new WeakSet<object>()): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map(item => stringifyContent(item, visited)).join('');
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;

      if (visited.has(obj)) {
        return '';
      }
      visited.add(obj);

      if ('value' in obj) {
        return stringifyContent(obj.value, visited);
      }
      if ('text' in obj) {
        return stringifyContent(obj.text, visited);
      }
      if ('content' in obj) {
        return stringifyContent(obj.content, visited);
      }
      if ('output_text' in obj) {
        return stringifyContent(obj.output_text, visited);
      }
      if ('outputText' in obj) {
        return stringifyContent(obj.outputText, visited);
      }
      if ('parts' in obj) {
        return stringifyContent(obj.parts, visited);
      }
      if ('annotations' in obj) {
        return stringifyContent(obj.annotations, visited);
      }
      if ('message' in obj) {
        return stringifyContent(obj.message, visited);
      }
      if ('segments' in obj) {
        return stringifyContent(obj.segments, visited);
      }
      if ('choices' in obj && Array.isArray(obj.choices)) {
        return (obj.choices as unknown[])
          .map(choice =>
            stringifyContent(
              (choice as any)?.message ??
              (choice as any)?.delta ??
              (choice as any)?.content ??
              (choice as any)?.text,
              visited
            )
          )
          .join('');
      }
      if ('messages' in obj && Array.isArray(obj.messages)) {
        return stringifyContent(obj.messages, visited);
      }
      if ('outputs' in obj && Array.isArray(obj.outputs)) {
        return stringifyContent(obj.outputs, visited);
      }
      if ('response' in obj) {
        return stringifyContent(obj.response, visited);
      }
    }

    return '';
  }

  /**
   * Resolve a likely role string from differing payload shapes
   */
  function resolveRole(source: Record<string, any>): string | undefined {
    if (typeof source.role === 'string') {
      return source.role;
    }
    if (typeof source.type === 'string') {
      return source.type;
    }
    if (source.author && typeof source.author.role === 'string') {
      return source.author.role;
    }
    if (source.data?.role && typeof source.data.role === 'string') {
      return source.data.role;
    }
    if (source.message?.role && typeof source.message.role === 'string') {
      return source.message.role;
    }
    return undefined;
  }

  /**
   * Get overlay configuration
   */
  function getOverlayConfig() {
    return config.overlay;
  }

  /**
   * Update client options
   */
  function configure(newOptions: Partial<TaskMaprClientOptions>) {
    config = {
      ...config,
      ...newOptions,
      retry: {
        attempts: newOptions.retry?.attempts ?? config.retry?.attempts ?? 3,
        backoff: newOptions.retry?.backoff ?? config.retry?.backoff ?? 1000,
      },
      overlay: {
        ...config.overlay,
        ...newOptions.overlay,
        ...(newOptions.overlay?.theme && {
          theme: {
            ...config.overlay?.theme,
            ...newOptions.overlay.theme,
          },
        }),
      },
    };
  }

  /**
   * Get current configuration
   */
  function getConfig() {
    return { ...config };
  }

  // Create the client API object
  const client: TaskMaprClient = {
    sendMessage,
    getOverlayConfig,
    configure,
    getConfig,
    // Pre-configured Overlay component that wraps itself in the provider
    Overlay: () => (
      <TaskMaprProvider client={client}>
        <SelfContainedOverlay />
      </TaskMaprProvider>
    ),
  };

  return client;
}
