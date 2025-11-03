export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  /** CSS selector(s) to highlight when this message is displayed */
  highlight?: {
    selector: string;
    duration?: number; // Duration in ms, if omitted highlight persists
  }[];
}

export interface TaskMaprOverlayProps {
  /** Title displayed in the chat header */
  title?: string;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Initial messages to display */
  initialMessages?: Message[];
  /** Callback when user sends a message */
  onSendMessage?: (message: string) => void | Promise<void>;
  /** Custom width of the chat panel (default: 320px) */
  width?: string;
  /** Minimum width when resizing (default: 280px) */
  minWidth?: string;
  /** Maximum width when resizing (default: 600px) */
  maxWidth?: string;
  /** Enable resizing with drag handle (default: true) */
  resizable?: boolean;
  /** Whether the chat is initially open */
  defaultOpen?: boolean;
  /** Custom toggle button position from bottom (default: 24px) */
  toggleButtonBottom?: string;
  /** Custom toggle button position from right (default: 24px) */
  toggleButtonRight?: string;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Enable automatic UI highlighting based on message metadata (default: true) */
  enableHighlighting?: boolean;
}

export interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  theme?: 'light' | 'dark';
}

export interface MessageListProps {
  messages: Message[];
  showTimestamps?: boolean;
  enableHighlighting?: boolean;
  theme?: 'light' | 'dark';
}

export interface HighlightableComponent {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  element: HTMLElement;
  onHighlightClick?: () => void;
}

export interface WalkthroughStep {
  /** Query to find the component (name, keyword, or ID) */
  query: string;
  /** Page/route where this step should occur (e.g., '/', '/features') */
  page?: string;
  /** Duration to highlight in ms (if omitted, waits for click) */
  duration?: number;
  /** Message to display for this step */
  message?: string;
  /** Whether to wait for click before proceeding (default: true) */
  waitForClick?: boolean;
}

export interface Walkthrough {
  id: string;
  steps: WalkthroughStep[];
  currentStepIndex: number;
  onComplete?: () => void;
  onStepChange?: (stepIndex: number, step: WalkthroughStep) => void;
}

// TaskMapr Client Configuration Types

export type AgentFramework = 'openai-agents' | 'swarm' | 'custom';

export interface TaskMaprClientOptions {
  /** API key for authentication */
  apiKey?: string;
  
  /** Agent framework type */
  framework?: AgentFramework;
  
  /** AI model to use (e.g., 'gpt-4o', 'gpt-4-turbo') */
  model?: string;
  
  /** Temperature for AI responses (0-2) */
  temperature?: number;
  
  /** Maximum tokens for responses */
  maxTokens?: number;
  
  /** System instructions for the agent */
  instructions?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Custom headers for API requests */
  headers?: Record<string, string>;
  
  /** Retry configuration */
  retry?: {
    attempts: number;
    backoff: number; // milliseconds
  };
  
  /** Overlay display options */
  overlay?: {
    title?: string;
    placeholder?: string;
    showTimestamps?: boolean;
    enableHighlighting?: boolean;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };
  
  /** Initial welcome message(s) */
  initialMessages?: Message[];
  
  /** Callback when a message is sent (before API call) */
  onMessageSent?: (message: Message) => void;
  
  /** Callback when a response is received */
  onMessageReceived?: (message: Message) => void;
  
  /** Callback for errors */
  onError?: (error: Error) => void;
  
  /** Custom context provider for API requests */
  getContext?: () => Record<string, any>;
  
  /** Enable mock mode (no API calls) */
  mockMode?: boolean;
  
  /** Custom mock response handler */
  mockResponseHandler?: (message: string, context?: Record<string, any>) => Promise<Message>;
}

export interface TaskMaprClient {
  /** Send a message to the agent and get a response */
  sendMessage: (message: string, context?: Record<string, any>) => Promise<Message>;
  
  /** Get overlay configuration */
  getOverlayConfig: () => TaskMaprClientOptions['overlay'];
  
  /** Update client options */
  configure: (options: Partial<TaskMaprClientOptions>) => void;
  
  /** Get current configuration */
  getConfig: () => TaskMaprClientOptions;
  
  /** Pre-configured Overlay component - use as <client.Overlay /> */
  Overlay: React.ComponentType;
}
