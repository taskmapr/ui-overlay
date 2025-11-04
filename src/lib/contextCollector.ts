import { Message } from '../types';
import { getVisibleElementSnapshots } from '../utils/domVisibility';
import { AgentContextPackage } from './agentOrchestrator';

export interface ContextCollectorOptions {
  /** Whether to include DOM snapshots (default: true) */
  includeDomSnapshots?: boolean;
  
  /** Maximum number of messages to include in history (default: all) */
  historyLimit?: number;
  
  /** Custom context provider function */
  getCustomContext?: () => Record<string, any>;
}

/**
 * Collects and packages all relevant context for the Agent SDK
 * 
 * This function gathers:
 * - The current user prompt
 * - Full chat history
 * - Visible DOM elements with rich metadata
 * - Page context (URL, title, etc.)
 * - Custom application context
 * 
 * @param prompt - The current user message/prompt
 * @param history - Array of all messages in the conversation
 * @param options - Configuration options for context collection
 * @returns Complete context package ready for Agent SDK
 */
export function collectAgentContext(
  prompt: string,
  history: Message[],
  options: ContextCollectorOptions = {}
): AgentContextPackage {
  const {
    includeDomSnapshots = true,
    historyLimit,
    getCustomContext,
  } = options;

  // Collect DOM snapshots if enabled
  const domElements = includeDomSnapshots ? getVisibleElementSnapshots() : [];

  // Limit history if specified
  const limitedHistory = historyLimit 
    ? history.slice(-historyLimit)
    : history;

  // Collect page context
  const pageContext = {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    title: document.title,
  };

  // Collect custom context if provider is available
  const customContext = getCustomContext ? getCustomContext() : undefined;

  // Extract walkthrough context from custom context if present
  const walkthroughContext = customContext?.activeWalkthrough || undefined;

  // Build complete context package
  const contextPackage: AgentContextPackage = {
    prompt,
    history: limitedHistory,
    domElements,
    pageContext,
    walkthroughContext,
    customContext,
    timestamp: new Date(),
  };

  return contextPackage;
}

/**
 * Utility: Get a lightweight context summary for logging/debugging
 */
export function getContextSummary(context: AgentContextPackage): string {
  return `
Context Summary:
- Prompt: "${context.prompt.slice(0, 50)}${context.prompt.length > 50 ? '...' : ''}"
- History: ${context.history.length} messages
- DOM Elements: ${context.domElements.length} visible
- Page: ${context.pageContext.pathname}
- Walkthrough: ${context.walkthroughContext ? `Active (${context.walkthroughContext.currentStepIndex + 1}/${context.walkthroughContext.totalSteps})` : 'None'}
- Timestamp: ${context.timestamp.toISOString()}
  `.trim();
}

/**
 * Utility: Extract interactive elements from context for quick access
 */
export function getInteractiveElements(context: AgentContextPackage) {
  return context.domElements.filter(el => el.isInteractive);
}

/**
 * Utility: Get recent user messages from history
 */
export function getRecentUserMessages(context: AgentContextPackage, limit: number = 5) {
  return context.history
    .filter(msg => msg.role === 'user')
    .slice(-limit);
}

/**
 * Utility: Check if context includes specific element by id
 */
export function hasElementInContext(context: AgentContextPackage, elementId: string): boolean {
  return context.domElements.some(el => el.id === elementId);
}
