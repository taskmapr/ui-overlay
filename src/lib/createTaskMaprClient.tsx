import { TaskMaprClient, TaskMaprClientOptions, Message, AgentFramework } from '../types';
import { TaskMaprProvider } from '../contexts/TaskMaprContext';
import { SelfContainedOverlay } from '../components/SelfContainedOverlay';

const DEFAULT_OPTIONS = {
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

  /**
   * Send a message to the agent and get a response
   */
  async function sendMessage(
    message: string,
    context?: Record<string, any>
  ): Promise<Message> {
    // Use mock mode if enabled or if no endpoint provided
    if (config.mockMode || !agentEndpoint) {
      if (config.mockResponseHandler) {
        return await config.mockResponseHandler(message, context);
      }
      
      // Default mock response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Mock response: Got your message "${message}"\n\n(Configure agent endpoint to connect to a real agent)`,
        timestamp: new Date(),
      };
    }

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

      const data = await response.json();

      // Transform response to Message format
      const assistantMessage: Message = {
        id: data.id || Date.now().toString(),
        role: 'assistant',
        content: data.content || data.message || '',
        timestamp: new Date(data.timestamp || Date.now()),
        highlight: data.highlight,
      };

      return assistantMessage;
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
