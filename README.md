# TaskMapr UI Overlay

[![npm version](https://img.shields.io/npm/v/@taskmapr/ui-overlay.svg)](https://www.npmjs.com/package/@taskmapr/ui-overlay)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Backed by MIT Sandbox](https://img.shields.io/badge/Backed_by-MIT_Sandbox-A31F34.svg)](https://innovation.mit.edu/entrepreneurship-2/mit-sandbox-innovation-fund/)

**Bring Cursor-style AI assistance to your React applications**

A beautiful, fully-featured overlay component that adds AI chat, UI highlighting, and interactive walkthroughs to any React app. Think "Cursor for websites."

## ✨ Features

- 💬 **Self-contained chat overlay** - Drop in one component, get full AI chat
- 🤖 **AI agent integration** - Works with OpenAI Agents SDK, Swarm, or custom backends
- 🎯 **Smart UI highlighting** - Auto-discover elements by ID or keywords
- 🗺️ **Guided walkthroughs** - Create interactive product tours
- 📘 **Full TypeScript support** - Complete type definitions included
- 🎨 **Beautiful dark theme** - Polished UI out of the box
- ⚡ **Zero config** - Works with mock responses when no backend is connected

## Installation

```bash
npm install @taskmapr/ui-overlay
```

## 📚 Library vs Demo Code

**Important**: This repository contains both:

1. **Library code** (`/src/*`) - Exported after `npm install` ✅
   - `createTaskMaprClient` - Client factory
   - `HighlightProvider`, `useHighlight` - Context and hooks
   - All utility hooks and functions
   - TypeScript types

2. **Demo code** (`/src/demo/*`) - Example usage, NOT exported ⚠️
   - Shows HOW to configure the library for your app
   - `useTaskMapr` hook is demo-specific configuration
   - You'll create your own version adapted to your needs

## Quick Start

```tsx
import { createTaskMaprClient, HighlightProvider } from '@taskmapr/ui-overlay';

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
import { createTaskMaprClient } from '@taskmapr/ui-overlay';

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
import { useHighlight } from '@taskmapr/ui-overlay';

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 API Reference

Full API documentation coming soon. For now, check the TypeScript types in the package for complete API details.

## 🐛 Issues

Found a bug? Have a feature request? [Open an issue](https://github.com/taskmapr/ui-overlay/issues) on GitHub.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **npm Package**: https://www.npmjs.com/package/@taskmapr/ui-overlay
- **GitHub Repository**: https://github.com/taskmapr/ui-overlay
- **Issues**: https://github.com/taskmapr/ui-overlay/issues

---

**Built with ❤️ by TaskMapr** • Add AI superpowers to your React apps
