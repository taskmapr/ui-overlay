# TaskMapr UI Overlay

[![npm version](https://img.shields.io/npm/v/@taskmapr/ui-overlay.svg)](https://www.npmjs.com/package/@taskmapr/ui-overlay)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Backed by MIT Sandbox](https://img.shields.io/badge/Backed_by-MIT_Sandbox-A31F34.svg)](https://innovation.mit.edu/entrepreneurship-2/mit-sandbox-innovation-fund/)

**Bring Cursor-style AI assistance to your React applications**

A beautiful, fully-featured overlay component that adds AI chat, UI highlighting, and interactive walkthroughs to any React app. Think "Cursor for websites."

## Features

- Self-contained chat overlay with full AI chat
- Agent SDK integration with OpenAI Agents SDK, Swarm, or custom backends
- Full context (prompt, history, DOM) sent to your agent
- Smart UI highlighting - auto-discover elements by ID or keywords
- Guided walkthroughs for interactive product tours
- Full TypeScript support with complete type definitions
- Beautiful dark theme out of the box
- All styles bundled - no CSS overrides needed
- Zero config - works with mock responses when no backend is connected
- Easy setup - just `npm install` and one CSS import

## Installation

```bash
npm install @taskmapr/ui-overlay
```

## Setup

The library includes all necessary styles bundled. Simply import the CSS file:

```tsx
import '@taskmapr/ui-overlay/taskmapr-overlay.css';
```

**That's it!** No additional CSS files or overrides needed. The library handles all styling internally.

## 📚 Library vs Demo Code

**Important**: This repository contains both:

1. **Library code** (`/src/*`) - Exported after `npm install` ✅
   - `createTaskMaprClient` - Client factory
   - `HttpAgentOrchestrator` - HTTP-based orchestrator with SSE streaming
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
// Import the bundled CSS (all styles included, no overrides needed!)
import '@taskmapr/ui-overlay/taskmapr-overlay.css';

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

**Minimal Setup**: Just two imports and you're ready to go. No CSS overrides, no configuration files - the library handles everything internally.

## AI Agent Integration

### HTTP Agent Orchestrator (Recommended)

For most use cases, use the built-in `HttpAgentOrchestrator` to connect to a TaskMapr backend server with SSE streaming support:

```tsx
import { createTaskMaprClient, HttpAgentOrchestrator } from '@taskmapr/ui-overlay';

const agentEndpoint = 'http://localhost:8000/api/taskmapr/orchestrate';

const taskmapr = createTaskMaprClient(agentEndpoint, {
  orchestrator: {
    orchestrator: new HttpAgentOrchestrator(agentEndpoint, {
      getAccessToken: () => yourSupabaseToken, // Optional: for auth
      timeout: 60000, // Optional: request timeout
    }),
    includeDomSnapshots: true,
  },
  overlay: {
    title: 'AI Assistant',
    placeholder: 'Ask me anything...',
  },
});
```

**Features:**
- ✅ SSE (Server-Sent Events) streaming support
- ✅ Real-time text streaming with `text_delta` events
- ✅ Reasoning and tool call notifications
- ✅ Automatic error handling and retries
- ✅ Works with TaskMapr orchestrator backend

### Custom Agent SDK Orchestration

Use this when you want full control over agent orchestration with tools that have knowledge of your repo and workflows.

```tsx
import { createTaskMaprClient, AgentOrchestrator } from '@taskmapr/ui-overlay';

class MyAgentOrchestrator implements AgentOrchestrator {
  async orchestrate(context) {
    // context includes: prompt, history, domElements, pageContext
    const response = await myAgentSDK.run({
      prompt: context.prompt,
      history: context.history,
      domElements: context.domElements,
      tools: [repoKnowledgeTool, workflowTool],
    });
    return { message: response };
  }
}

const taskmapr = createTaskMaprClient('', {
  orchestrator: {
    orchestrator: new MyAgentOrchestrator(),
    includeDomSnapshots: true,
  },
});
```

**What your agent receives:**
- Current user prompt
- Full conversation history
- All visible DOM elements (IDs, text, classes, positions, interactivity)
- Page context (URL, title)
- Active walkthrough state


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

## Hooks

TaskMapr provides several hooks for advanced use cases:

### Hooks

- `useVisibleHtmlIds` - Track visible DOM elements with rich metadata
- `useVisibleComponents` - Track TaskMapr's highlightable components
- `useHighlight` - Access highlighting context and walkthrough functions

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
