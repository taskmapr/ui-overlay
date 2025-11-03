// Legacy component (for backward compatibility)
export { TaskMaprOverlay } from './components/TaskMaprOverlay';

// Core library exports (recommended pattern)
export { createTaskMaprClient } from './lib/createTaskMaprClient';
export { TaskMaprProvider, useTaskMaprClient } from './contexts/TaskMaprContext';

// Feature contexts and hooks
export { HighlightProvider, useHighlight } from './contexts/HighlightContext';
export { useHighlightable } from './hooks/useHighlightable';

// Individual components (for advanced usage)
export { MessageList } from './components/MessageList';
export { MessageInput } from './components/MessageInput';
export { HighlightScanner } from './components/HighlightScanner';
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
  AgentFramework
} from './types';
