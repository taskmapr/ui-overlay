# TaskMapr Overlay

Cursor-style overlay for React with chat, UI highlighting, and guided walkthroughs.

**Features:** Auto-discovery • ID-based highlighting • Interactive tours • TypeScript • Dark theme

## Installation

```bash
npm install @james12340/ui-overlay
```

## Quick Start

```tsx
import { createTaskMaprClient, HighlightProvider } from '@james12340/ui-overlay';

// Initialize client once with your configuration
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
      content: 'Hello! How can I help you today?',
      timestamp: new Date(),
    }],
  }
);

function App() {
  return (
    <HighlightProvider>
      <h1 id="hero" data-highlight-keywords="title, header">My App</h1>
      <section id="features">...</section>
      
      {/* One line - fully self-contained! */}
      <taskmapr.Overlay />
    </HighlightProvider>
  );
}
```

## AI Agent Integration

Connect TaskMapr to your AI agent backend (OpenAI Agents SDK, Swarm, or custom):

### 1. Configure Environment Variables

Create a `.env` file:

```bash
VITE_AGENT_ENDPOINT=http://localhost:8000/api/agent
VITE_OPENAI_API_KEY=sk-your-api-key
VITE_AGENT_MODEL=gpt-4o  # optional
```

### 2. Initialize the Client

```tsx
import { createTaskMaprClient } from '@james12340/ui-overlay';

const taskmapr = createTaskMaprClient(
  import.meta.env.VITE_AGENT_ENDPOINT,
  {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    framework: 'openai-agents',  // or 'swarm' or 'custom'
    model: 'gpt-4o',
    instructions: 'You are a helpful assistant...',
    overlay: {
      title: 'AI Assistant',
      showTimestamps: true,
    },
  }
);
```

### 3. Use in Your App

The overlay is **fully self-contained** - it manages its own message state internally:

```tsx
function App() {
  return (
    <>
      <YourContent />
      <taskmapr.Overlay /> {/* That's it! */}
    </>
  );
}
```

**Advanced: Manual message sending** (if needed):

```tsx
const response = await taskmapr.sendMessage('Hello', {
  currentPage: location.pathname,
});
```

### Supported Agent Frameworks

- **[OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)** - Python SDK for multi-agent orchestration
- **[OpenAI Swarm](https://github.com/openai/swarm)** - Lightweight multi-agent framework
- **Custom** - Your own agent implementation

### Expected Agent API Format

Your agent endpoint should accept:

```json
{
  "message": "user message",
  "context": { "currentPage": "/features" },
  "config": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 1000,
    "instructions": "system prompt",
    "framework": "openai-agents"
  }
}
```

And return:

```json
{
  "id": "msg-123",
  "content": "response text",
  "timestamp": "2024-01-01T00:00:00Z",
  "highlight": [  // optional
    { "selector": "#hero", "duration": 3000 }
  ]
}
```

## Highlighting

Any element with an `id` is auto-discoverable:

```tsx
<h1 id="hero">Title</h1>
<section id="features" data-highlight-keywords="capabilities, list">...</section>
```

Users can type "show me features" or "hero" in chat to highlight elements.

## Walkthroughs

```tsx
import { useHighlight } from '@james12340/ui-overlay';

function App() {
  const { startWalkthrough } = useHighlight();
  
  const tour = () => {
    startWalkthrough([
      { query: 'hero', message: 'This is the title', waitForClick: true },
      { query: 'features', message: 'Check out features', waitForClick: true },
    ], {
      onComplete: () => console.log('Done!')
    });
  };
  
  return <button onClick={tour}>Start Tour</button>;
}
```

## License

MIT
