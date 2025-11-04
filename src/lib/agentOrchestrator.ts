import { Message, VisibleElementSnapshot } from '../types';

/**
 * Complete context package sent to Agent SDK for orchestration
 */
export interface AgentContextPackage {
  /** Current user prompt/message */
  prompt: string;
  
  /** Full chat history including system, user, and assistant messages */
  history: Message[];
  
  /** Visible DOM elements on the current page */
  domElements: VisibleElementSnapshot[];
  
  /** Current page/route information */
  pageContext: {
    /** Current URL pathname */
    pathname: string;
    /** Current URL search params */
    search: string;
    /** Current URL hash */
    hash: string;
    /** Page title */
    title: string;
  };
  
  /** Active walkthrough state if any */
  walkthroughContext?: {
    id: string;
    currentStepIndex: number;
    totalSteps: number;
    currentStep: any;
  };
  
  /** Custom application context */
  customContext?: Record<string, any>;
  
  /** Timestamp when context was collected */
  timestamp: Date;
  
  /** Optional session ID for maintaining conversation state */
  sessionId?: string;
}

/**
 * Response from Agent SDK orchestrator
 */
export interface AgentOrchestratorResponse {
  /** Response message to display to user */
  message: Message;
  
  /** Optional: Actions the agent wants to trigger */
  actions?: AgentAction[];
  
  /** Optional: Metadata about the response */
  metadata?: {
    /** Tokens used in the request */
    tokensUsed?: number;
    /** Model used for generation */
    model?: string;
    /** Processing time in milliseconds */
    processingTime?: number;
    /** Tool calls made during orchestration */
    toolCalls?: Array<{
      tool: string;
      result: any;
    }>;
  };
}

/**
 * Actions that the agent can trigger in the application
 */
export type AgentAction = 
  | { type: 'navigate'; payload: { path: string } }
  | { type: 'highlight'; payload: { selectors: string[]; duration?: number } }
  | { type: 'startWalkthrough'; payload: { steps: any[] } }
  | { type: 'scrollTo'; payload: { selector: string; behavior?: 'smooth' | 'auto' } }
  | { type: 'click'; payload: { selector: string } }
  | { type: 'custom'; payload: Record<string, any> };

/**
 * Streaming callbacks for real-time updates during orchestration
 */
export interface StreamingCallbacks {
  /** Called when text content is received (streaming) */
  onTextDelta?: (text: string) => void;
  
  /** Called when reasoning starts */
  onReasoningStart?: () => void;
  
  /** Called when reasoning content is received (streaming) */
  onReasoningDelta?: (text: string) => void;
  
  /** Called when reasoning ends */
  onReasoningDone?: () => void;
  
  /** Called when a tool call starts */
  onToolCallStarted?: (toolName: string) => void;
  
  /** Called when a tool call completes */
  onToolCallCompleted?: (toolName: string) => void;
  
  /** Called when actions are received for the UI */
  onActions?: (actions: AgentAction[]) => void;
  
  /** Called when metadata is received */
  onMetadata?: (metadata: Record<string, any>) => void;
  
  /** Called when an error occurs */
  onError?: (error: string) => void;
  
  /** Called when the stream completes */
  onComplete?: (sessionId?: string) => void;
}

/**
 * Abstract interface for Agent SDK Orchestrator
 * 
 * Implement this interface to integrate your own Agent SDK with TaskMapr.
 * The orchestrator receives the full context package and returns a response.
 * 
 * @example
 * ```typescript
 * class MyAgentOrchestrator implements AgentOrchestrator {
 *   async orchestrate(context: AgentContextPackage): Promise<AgentOrchestratorResponse> {
 *     // Call your Agent SDK with tools that have repo/workflow knowledge
 *     const response = await myAgentSDK.run({
 *       prompt: context.prompt,
 *       history: context.history,
 *       tools: [repoKnowledgeTool, workflowTool],
 *       context: {
 *         domElements: context.domElements,
 *         page: context.pageContext
 *       }
 *     });
 *     
 *     return {
 *       message: {
 *         id: response.id,
 *         role: 'assistant',
 *         content: response.content,
 *         timestamp: new Date()
 *       }
 *     };
 *   }
 * }
 * ```
 */
export interface AgentOrchestrator {
  /**
   * Main orchestration method - receives complete context and returns response
   * 
   * @param context - Complete context package with prompt, history, DOM elements, etc.
   * @param callbacks - Optional streaming callbacks for real-time updates
   * @returns Agent response with message and optional actions
   */
  orchestrate(
    context: AgentContextPackage,
    callbacks?: StreamingCallbacks
  ): Promise<AgentOrchestratorResponse>;
  
  /**
   * Optional: Initialize the orchestrator with configuration
   */
  initialize?(config: Record<string, any>): Promise<void>;
  
  /**
   * Optional: Cleanup resources when orchestrator is no longer needed
   */
  dispose?(): Promise<void>;
}

/**
 * Configuration for Agent Orchestrator
 */
export interface AgentOrchestratorConfig {
  /** The orchestrator implementation */
  orchestrator: AgentOrchestrator;
  
  /** Whether to include DOM snapshots in every request (default: true) */
  includeDomSnapshots?: boolean;
  
  /** Whether to include full history or just recent messages */
  historyLimit?: number;
  
  /** Custom context transformer before sending to orchestrator */
  transformContext?: (context: AgentContextPackage) => AgentContextPackage;
  
  /** Custom response transformer after receiving from orchestrator */
  transformResponse?: (response: AgentOrchestratorResponse) => AgentOrchestratorResponse;
  
  /** Error handler for orchestration failures */
  onOrchestrationError?: (error: Error, context: AgentContextPackage) => void;
}
