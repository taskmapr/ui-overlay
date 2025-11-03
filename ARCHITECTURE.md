# TaskMapr Architecture: Best Practices Implementation

## Pattern: Supabase-Style Client Factory

TaskMapr follows the **client factory pattern** popularized by Supabase, React Query, and Apollo Client.

### Before (Props-based)

```tsx
// App.tsx - Manual state management (verbose)
const [messages, setMessages] = useState<Message[]>([]);

const handleSendMessage = async (content: string) => {
  const userMessage = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
  setMessages(prev => [...prev, userMessage]);
  
  try {
    const response = await fetch('/api/agent', { 
      method: 'POST',
      body: JSON.stringify({ message: content })
    });
    const data = await response.json();
    setMessages(prev => [...prev, data]);
  } catch (error) {
    // Error handling...
  }
};

return (
  <TaskMaprOverlay
    title="Chat"
    placeholder="Type..."
    initialMessages={messages}
    onSendMessage={handleSendMessage}
    showTimestamps={true}
    enableHighlighting={true}
  />
);
```

### After (Client Factory)

```tsx
// Single initialization
const taskmapr = createTaskMaprClient(
  import.meta.env.VITE_AGENT_ENDPOINT,
  {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    framework: 'openai-agents',
    model: 'gpt-4o',
    overlay: {
      title: 'AI Assistant',
      showTimestamps: true,
    },
    initialMessages: [{
      id: '1',
      role: 'assistant',
      content: 'Hello! How can I help you?',
      timestamp: new Date(),
    }],
    getContext: () => ({
      currentPage: window.location.pathname,
    }),
    onMessageReceived: (msg) => console.log('Received:', msg),
  }
);

// One line usage - NO state management needed!
return <taskmapr.Overlay />;
```

## Architecture Benefits

### 1. **Separation of Concerns**
- **Client Factory** (`createTaskMaprClient`) - Configuration & API logic
- **Context Provider** (`TaskMaprProvider`) - State distribution
- **Self-Contained Component** (`SelfContainedOverlay`) - UI & internal state
- **Public API** (`TaskMaprClient`) - Methods for advanced usage

### 2. **Single Configuration Point**
All configuration happens once:
```tsx
const taskmapr = createTaskMaprClient(endpoint, {
  // API settings
  apiKey, model, framework,
  
  // UI configuration
  overlay: { title, placeholder, theme },
  
  // Lifecycle hooks
  onMessageSent, onMessageReceived, onError,
  
  // Dynamic context
  getContext: () => ({ currentPage, userState }),
});
```

### 3. **No Prop Drilling**
The overlay component accesses client configuration via React Context:
```tsx
// Inside SelfContainedOverlay
const client = useTaskMaprClient();  // Gets client from context
const config = client.getOverlayConfig();
```

### 4. **Composable & Extensible**
```tsx
// Use the pre-configured component
<taskmapr.Overlay />

// Or access the client API directly
const response = await taskmapr.sendMessage('Hello');

// Or provide to other components
<TaskMaprProvider client={taskmapr}>
  <YourCustomUI />
</TaskMaprProvider>
```

## Implementation Pattern

### Client Factory Returns

```typescript
interface TaskMaprClient {
  // API methods
  sendMessage: (message: string, context?: any) => Promise<Message>;
  configure: (options: Partial<TaskMaprClientOptions>) => void;
  getConfig: () => TaskMaprClientOptions;
  getOverlayConfig: () => OverlayConfig;
  
  // Pre-configured component (key innovation!)
  Overlay: React.ComponentType;
}
```

The `Overlay` component wraps itself in a provider:
```tsx
Overlay: () => (
  <TaskMaprProvider client={client}>
    <SelfContainedOverlay />
  </TaskMaprProvider>
)
```

### Self-Contained Component

`SelfContainedOverlay` manages its own state:
- Message history
- Loading states
- UI state (open/closed, width)
- Sends messages via client API
- Calls lifecycle hooks

**No props needed** - everything comes from context!

## Comparison with Popular Libraries

| Library | Pattern | TaskMapr Equivalent |
|---------|---------|---------------------|
| **Supabase** | `createClient()` → methods | `createTaskMaprClient()` → API + Overlay |
| **React Query** | `QueryClient` + Provider | `TaskMaprClient` + Provider |
| **Apollo** | `ApolloClient` + Provider | `TaskMaprClient` + Provider |
| **Radix UI** | Compound components | `useHighlight()` for walkthroughs |

## File Structure

```
src/
├── lib/
│   └── createTaskMaprClient.tsx      # Factory function
├── contexts/
│   ├── TaskMaprContext.tsx            # Client context & provider
│   └── HighlightContext.tsx           # Feature-specific context
├── components/
│   ├── SelfContainedOverlay.tsx       # Main overlay (self-contained)
│   ├── TaskMaprOverlay.tsx            # Legacy component (backward compat)
│   ├── MessageList.tsx                # Sub-components
│   └── MessageInput.tsx
└── types.ts                            # TypeScript interfaces
```

## Key Design Decisions

### ✅ What We Did Right

1. **Single Initialization** - Configure once, use everywhere
2. **Self-Contained State** - Overlay manages its own messages
3. **Context for Distribution** - No prop drilling
4. **Lifecycle Hooks** - `onMessageSent`, `onMessageReceived`, `onError`
5. **Dynamic Context** - `getContext()` called on each message
6. **TypeScript First** - Strong typing for DX
7. **Backward Compatible** - Old `TaskMaprOverlay` still works

### 📚 Following Best Practices

Based on research from:
- Martin Fowler's Headless Component pattern
- Kent C. Dodds' React Context patterns
- Supabase client architecture
- React Query configuration patterns

### 🎯 Result

**App.tsx went from ~238 lines to ~150 lines**
- ❌ No message state management
- ❌ No `handleSendMessage` function
- ❌ No prop spreading
- ✅ Just `<taskmapr.Overlay />`

## Usage Patterns

### Basic
```tsx
const taskmapr = createTaskMaprClient(endpoint, config);
return <taskmapr.Overlay />;
```

### With Highlighting
```tsx
<HighlightProvider>
  <YourApp />
  <taskmapr.Overlay />
</HighlightProvider>
```

### Advanced: Custom UI
```tsx
<TaskMaprProvider client={taskmapr}>
  <CustomChatUI />
</TaskMaprProvider>

function CustomChatUI() {
  const client = useTaskMaprClient();
  // Build your own UI using client API
}
```

## TypeScript Integration

```typescript
// Strict typing for configuration
type AgentFramework = 'openai-agents' | 'swarm' | 'custom';

interface TaskMaprClientOptions {
  apiKey?: string;
  framework?: AgentFramework;
  model?: string;
  overlay?: {
    title?: string;
    theme?: {
      primaryColor?: string;
      backgroundColor?: string;
    };
  };
  getContext?: () => Record<string, any>;
  onMessageReceived?: (msg: Message) => void;
  // ... more options
}
```

## Migration Guide

### Old Pattern (Still Supported)
```tsx
<TaskMaprOverlay
  title="Chat"
  initialMessages={messages}
  onSendMessage={handleSendMessage}
/>
```

### New Pattern (Recommended)
```tsx
const taskmapr = createTaskMaprClient(endpoint, {
  overlay: { title: 'Chat' },
  initialMessages: [...],
});

<taskmapr.Overlay />
```

## Summary

TaskMapr now implements industry-standard patterns for React component libraries:

1. ✅ **Factory Pattern** - Single initialization
2. ✅ **Context API** - State distribution without prop drilling
3. ✅ **Self-Contained Components** - Manage own state
4. ✅ **Headless Logic** - Separate logic from presentation
5. ✅ **Lifecycle Hooks** - Extensibility points
6. ✅ **TypeScript** - Type-safe configuration
7. ✅ **Backward Compatible** - Old API still works

This makes TaskMapr easy to integrate, configure, and extend while following React best practices.
