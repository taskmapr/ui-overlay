import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTaskMaprClient } from '../lib/createTaskMaprClient';
import { useHighlight } from '../contexts/HighlightContext';
import { Message } from '../types';
import { HttpAgentOrchestrator } from './HttpAgentOrchestrator';

/**
 * Demo-specific TaskMapr client configuration
 * Handles environment configuration, mock mode, and walkthrough integration
 */
export function useTaskMapr() {
  const { activeWalkthrough, highlight, highlightComponent } = useHighlight();
  const navigate = useNavigate();
  
  // Store walkthrough in a ref so getContext can access the current value dynamically
  const activeWalkthroughRef = useRef(activeWalkthrough);
  
  // Update ref when walkthrough changes
  useEffect(() => {
    activeWalkthroughRef.current = activeWalkthrough;
  }, [activeWalkthrough]);
  
  // Create client only once - getContext will provide dynamic values via ref
  const clientRef = useRef<ReturnType<typeof createTaskMaprClient> | null>(null);
  
  if (!clientRef.current) {
    // Default to orchestrator endpoint if VITE_AGENT_ENDPOINT is not set
    const agentEndpoint = import.meta.env.VITE_AGENT_ENDPOINT || 'http://localhost:8000/api/taskmapr/orchestrate';
    const supabaseToken = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    clientRef.current = createTaskMaprClient(agentEndpoint, {
      // Configure HTTP Agent Orchestrator with streaming support
      orchestrator: agentEndpoint ? {
        orchestrator: new HttpAgentOrchestrator(agentEndpoint, {
          getAccessToken: () => {
            // Try to get token from Supabase client if available
            // For now, use environment variable
            return supabaseToken;
          },
          timeout: 60000, // Longer timeout for streaming
        }),
        includeDomSnapshots: true,
      } : undefined,
      
      // API configuration (fallback for legacy mode)
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      framework: (import.meta.env.VITE_AGENT_FRAMEWORK as 'openai-agents' | 'swarm' | 'custom') || 'openai-agents',
      model: import.meta.env.VITE_AGENT_MODEL || 'gpt-4o',
      temperature: 0.7,
      
      // Enable mock mode if no endpoint configured
      mockMode: !agentEndpoint,
      
      // System instructions
      instructions: `You are a helpful assistant that guides users through a multi-page web application.
        You can help users navigate, understand features, and answer questions about the app.
        When appropriate, suggest starting a guided tour using the "Start Tour" button.`,
      
      // Initial welcome message
      initialMessages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! I can guide you through this multi-page app.\n\nTry:\n• Type "features" or "navigation"\n• Click "Start Tour" button for a cross-page walkthrough\n• Navigate between pages freely',
          timestamp: new Date(),
        },
      ],
      
      // Overlay configuration
      overlay: {
        title: 'Demo Chat',
        placeholder: 'Ask me anything...',
        showTimestamps: true,
        enableHighlighting: true,
      },
      
      // Context provider for each message - captures current location/walkthrough dynamically
      getContext: () => ({
        currentPage: window.location.pathname,
        activeWalkthrough: activeWalkthroughRef.current ? {
          id: activeWalkthroughRef.current.id,
          currentStepIndex: activeWalkthroughRef.current.currentStepIndex,
          totalSteps: activeWalkthroughRef.current.steps.length,
          currentStep: activeWalkthroughRef.current.steps[activeWalkthroughRef.current.currentStepIndex],
        } : null,
      }),
      
      // Callbacks for walkthrough integration
      onMessageReceived: (message: Message) => {
        console.log('Message received:', message);
        // Could add logic here to parse agent responses for walkthrough commands
      },
      
      // Action handlers for executing agent actions
      actionHandlers: {
        navigate: (path: string) => {
          console.log('[TaskMapr] Navigating to:', path);
          navigate(path);
        },
        highlight: (selectors: string[], duration?: number) => {
          console.log('[TaskMapr] Highlighting selectors:', selectors, 'duration:', duration);
          // Try each selector - first try as CSS selector, then as component query
          selectors.forEach((selector) => {
            // If it's a CSS selector (starts with #, ., or contains [), use highlight directly
            if (selector.startsWith('#') || selector.startsWith('.') || selector.includes('[')) {
              highlight(selector, duration);
            } else {
              // Otherwise, try to find it as a component by query
              const success = highlightComponent(selector, duration);
              if (!success) {
                // Fallback: try as CSS selector anyway
                highlight(selector, duration);
              }
            }
          });
        },
        scrollTo: (selector: string, behavior: 'smooth' | 'auto' = 'smooth') => {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({ behavior });
          }
        },
        click: (selector: string) => {
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            element.click();
          }
        },
      },
    });
  }
  
  return clientRef.current;
}
