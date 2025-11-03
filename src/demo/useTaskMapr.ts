import { useRef, useEffect } from 'react';
import { createTaskMaprClient } from '../lib/createTaskMaprClient';
import { useHighlight } from '../contexts/HighlightContext';
import { Message } from '../types';

/**
 * Demo-specific TaskMapr client configuration
 * Handles environment configuration, mock mode, and walkthrough integration
 */
export function useTaskMapr() {
  const { activeWalkthrough } = useHighlight();
  
  // Store walkthrough in a ref so getContext can access the current value dynamically
  const activeWalkthroughRef = useRef(activeWalkthrough);
  
  // Update ref when walkthrough changes
  useEffect(() => {
    activeWalkthroughRef.current = activeWalkthrough;
  }, [activeWalkthrough]);
  
  // Create client only once - getContext will provide dynamic values via ref
  const clientRef = useRef<ReturnType<typeof createTaskMaprClient> | null>(null);
  
  if (!clientRef.current) {
    const agentEndpoint = import.meta.env.VITE_AGENT_ENDPOINT || '';
    
    clientRef.current = createTaskMaprClient(agentEndpoint, {
      // API configuration
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
    });
  }
  
  return clientRef.current;
}
