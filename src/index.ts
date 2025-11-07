// Import styles to ensure they're bundled
import './styles/globals.css';

// Legacy component (for backward compatibility)
export { TaskMaprOverlay } from './components/TaskMaprOverlay';

// Core library exports (recommended pattern)
export { createTaskMaprClient } from './lib/createTaskMaprClient';
export { TaskMaprProvider, useTaskMaprClient } from './contexts/TaskMaprContext';

// Feature contexts and hooks
export { HighlightProvider, useHighlight } from './contexts/HighlightContext';
export { useHighlightable } from './hooks/useHighlightable';
export { useVisibleComponents } from './hooks/useVisibleComponents';
export { useVisibleHtmlIds } from './hooks/useVisibleHtmlIds';
export { useTaskMaprActionHandlers, navigateToPath } from './hooks/useTaskMaprActionHandlers';
export {
  useTaskMaprClientInstance,
  type UseTaskMaprClientInstanceOptions,
  type UseTaskMaprClientInstanceResult,
} from './hooks/useTaskMaprClientInstance';

// Utility functions
export { isElementVisible, isElementFullyVisible } from './utils/visibility';
export { getVisibleElementIds, getVisibleHtmlIds, getVisibleElementSnapshots } from './utils/domVisibility';

// Agent Orchestrator (for Agent SDK integration)
export type { 
  AgentOrchestrator,
  AgentOrchestratorConfig,
  AgentContextPackage,
  AgentOrchestratorResponse,
  AgentAction
} from './lib/agentOrchestrator';
export { HttpAgentOrchestrator } from './lib/HttpAgentOrchestrator';
export { 
  collectAgentContext,
  getContextSummary,
  getInteractiveElements,
  getRecentUserMessages,
  hasElementInContext
} from './lib/contextCollector';
export type { ContextCollectorOptions } from './lib/contextCollector';

// Individual components (for advanced usage)
export { MessageList } from './components/MessageList';
export { MessageInput } from './components/MessageInput';
export { HighlightScanner } from './components/HighlightScanner';
// Core types
export type { 
  Message, 
  TaskMaprOverlayProps, 
  MessageInputProps, 
  MessageListProps,
  HighlightableComponent,
  WalkthroughStep,
  Walkthrough,
  TaskMaprClient,
  TaskMaprClientOptions,
  AgentFramework,
  VisibleElementSnapshot
} from './types';
