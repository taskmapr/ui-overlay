# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-03

### Added
- Initial release of TaskMapr UI Overlay
- Core overlay component with chat interface
- Supabase-style client initialization with `createTaskMaprClient()`
- Support for OpenAI Agents SDK, Swarm, and custom backends
- UI highlighting system with auto-discovery via element IDs
- Keyword-based element search
- Guided walkthrough/tour functionality
- TypeScript support with full type definitions
- Dark theme UI
- Context provider pattern for easy integration
- Self-contained overlay with internal message state management

### Features
- **Client API**: `createTaskMaprClient()` for one-time setup
- **Overlay Component**: `<taskmapr.Overlay />` - fully self-contained
- **Highlighting**: `useHighlight()` hook for programmatic control
- **Walkthroughs**: `startWalkthrough()` for guided tours
- **Message Management**: Built-in message handling with retry logic
- **Environment Config**: Vite-style env vars (`VITE_AGENT_ENDPOINT`, etc.)

[1.0.0]: https://github.com/taskmapr/ui-overlay/releases/tag/v1.0.0
