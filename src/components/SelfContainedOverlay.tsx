import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Message } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { HighlightScanner } from './HighlightScanner';
import { useTaskMaprClient } from '../contexts/TaskMaprContext';
import { cn } from '../utils/cn';
import { injectFallbackCSS } from '../utils/fallbackCSS';

/**
 * Self-contained overlay that manages its own message state.
 * Gets configuration from TaskMaprClient via context.
 * No need to pass messages or handlers from parent.
 */
export const SelfContainedOverlay: React.FC = () => {
  const client = useTaskMaprClient();
  const overlayConfig = client.getOverlayConfig();
  const clientConfig = client.getConfig();
  
  // Inject fallback CSS on mount (safety net if host CSS isn't loaded)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      injectFallbackCSS();
    }
  }, []);
  
  // Internal message state - fully managed by this component
  const [messages, setMessages] = useState<Message[]>(
    clientConfig.initialMessages || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const streamingMessageIdRef = useRef<string | null>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const isResizingRef = useRef(false);
  
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const portalDiv = document.createElement('div');
    portalDiv.id = 'taskmapr-overlay-portal';
    portalDiv.className = 'tm-root';
    document.body.appendChild(portalDiv);
    setPortalElement(portalDiv);

    return () => {
      if (portalDiv.parentNode) {
        document.body.removeChild(portalDiv);
      }
      setPortalElement(null);
    };
  }, []);

  // Configuration with defaults
  const title = overlayConfig?.title || 'Chat';
  const placeholder = overlayConfig?.placeholder || 'Type a message...';
  const showTimestamps = overlayConfig?.showTimestamps ?? true;
  const enableHighlighting = overlayConfig?.enableHighlighting ?? true;
  const resizable = true;
  const minWidthPx = 280;
  const maxWidthPx = 600;

      // Handle streaming message updates via onMessageReceived callback
  useEffect(() => {
    // Set up streaming message handler that updates React state
    const handleStreamingUpdate = (message: Message) => {
      // Track streaming message ID and manage loading state
      if (message.role === 'assistant') {
        const isStreamingMessage = streamingMessageIdRef.current === message.id;
        const isEmptyMessage = message.content === '';
        
        // If it's a new assistant message (empty or different ID), track it
        if (!streamingMessageIdRef.current || (isEmptyMessage && !isStreamingMessage)) {
          // Update to the actual message ID if we had a placeholder
          streamingMessageIdRef.current = message.id;
          setIsLoading(true);
        }
        // If this is the streaming message (with or without content), keep loading true
        else if (isStreamingMessage) {
          setIsLoading(true);
        }
      }
      
      
      // Use functional update to ensure we get latest state
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === message.id);
        if (index >= 0) {
          // Update existing message (for streaming updates)
          const existing = prev[index];
          // Only update if content actually changed to avoid unnecessary re-renders
          if (existing.content === message.content && existing.role === message.role) {
            // Content unchanged, return same array to prevent re-render
            return prev;
          }
          // Content changed, create new array with updated message
          const updated = [...prev];
          updated[index] = { ...message };
          return updated;
        } else {
          // Check if we've already processed this message ID to prevent duplicates
          if (processedMessageIdsRef.current.has(message.id)) {
            // Message already processed, don't add again
            return prev;
          }
          // Mark as processed
          processedMessageIdsRef.current.add(message.id);
          // Add new message if not found (for initial placeholder)
          return [...prev, { ...message }];
        }
      });
    };

    // Get current config and merge with our handler
    const currentConfig = client.getConfig();
    client.configure({
      ...currentConfig,
      onMessageReceived: handleStreamingUpdate,
    });

    // Cleanup: restore original callback if it existed
    return () => {
      const config = client.getConfig();
      if (config.onMessageReceived === handleStreamingUpdate) {
        // Only restore if we're still the active handler
        const originalOnMessageReceived = clientConfig.onMessageReceived;
        client.configure({
          ...config,
          onMessageReceived: originalOnMessageReceived,
        });
      }
    };
  }, [client, clientConfig]);

  // Handle sending messages - fully internal
  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, userMessage]);
      
      // Call lifecycle hook if provided
      if (clientConfig.onMessageSent) {
        clientConfig.onMessageSent(userMessage);
      }
      
      setIsLoading(true);
      // Create a placeholder message ID for the incoming response
      const placeholderMessageId = `assistant-${Date.now()}`;
      streamingMessageIdRef.current = placeholderMessageId;
      // Clear processed IDs for new message
      processedMessageIdsRef.current.clear();
      
      try {
        // Use client to send message
        // For streaming, messages will be added/updated via onMessageReceived callback
        // Note: sendMessage resolves when streaming completes, so isLoading will be set to false
        const response = await client.sendMessage(content);
        
        // Track the streaming message ID (use response ID if different)
        if (response.id !== placeholderMessageId) {
          streamingMessageIdRef.current = response.id;
        }
        
        // Final message should already be in state from streaming updates via handleStreamingUpdate
        // Since onComplete already sent the final update, we should NOT update again here
        // This prevents duplicate messages from appearing
        // Only perform a safety check to ensure message exists, but don't update if it does
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === response.id);
          if (index >= 0) {
            // Message already exists from streaming - do NOT update again
            // This prevents duplicate messages
            return prev;
          } else {
            // Message missing (shouldn't happen with streaming, but safety fallback)
            // Check for duplicates by content to avoid adding the same message twice
            const duplicateByContent = prev.some(
              (m) => m.role === response.role && 
                     m.content === response.content && 
                     Math.abs(m.timestamp.getTime() - response.timestamp.getTime()) < 1000
            );
            if (duplicateByContent) {
              // Duplicate found, don't add
              return prev;
            }
            return [...prev, { ...response }];
          }
        });
        
        // Streaming is complete - clear the streaming ID and set loading to false
        streamingMessageIdRef.current = null;
        setIsLoading(false);
      } catch (error) {
        console.error('TaskMapr error:', error);
        
        // Call error handler if provided
        if (clientConfig.onError && error instanceof Error) {
          clientConfig.onError(error);
        }
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        // Ensure loading is set to false when done
        // The streaming handler will keep it true during streaming
        if (streamingMessageIdRef.current === null) {
          setIsLoading(false);
        }
      }
    },
    [client, clientConfig]
  );

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev;
      console.log('[TaskMapr] Toggle chat:', newState ? 'open' : 'closed');
      return newState;
    });
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => prev === 'dark' ? 'light' : 'dark');
  };

  // Use ref to access panel element and update transform when isOpen changes
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Update transform when isOpen changes
  useEffect(() => {
    if (panelRef.current) {
      const transform = isOpen ? 'translateX(0)' : 'translateX(100%)';
      panelRef.current.style.setProperty('transform', transform, 'important');
      panelRef.current.style.setProperty('-webkit-transform', transform, 'important');
      panelRef.current.style.setProperty('pointer-events', isOpen ? 'auto' : 'none', 'important');
    }
  }, [isOpen]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    e.stopPropagation();
    console.log('[TaskMapr] Resize start:', e.clientX, 'current width:', currentWidth);
    
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = currentWidth;
    isResizingRef.current = true;
    setIsResizing(true);
    
    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    
    // Set up event listeners immediately (don't wait for useEffect)
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = resizeStartX.current - moveEvent.clientX;
      const newWidth = Math.min(
        Math.max(resizeStartWidth.current + deltaX, minWidthPx),
        maxWidthPx
      );
      console.log('[TaskMapr] Resize move:', moveEvent.clientX, 'delta:', deltaX, 'new width:', newWidth);
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      upEvent.preventDefault();
      upEvent.stopPropagation();
      console.log('[TaskMapr] Resize end');
      isResizingRef.current = false;
      setIsResizing(false);
      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      // Remove listeners
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };

    // Add listeners immediately with capture phase
    const options = { capture: true, passive: false };
    document.addEventListener('mousemove', handleMouseMove, options);
    document.addEventListener('mouseup', handleMouseUp, options);
    window.addEventListener('mousemove', handleMouseMove, options);
    window.addEventListener('mouseup', handleMouseUp, options);
  }, [resizable, currentWidth, minWidthPx, maxWidthPx]);

  // Handle body padding and main content container to push content
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const marginValue = isOpen ? `${currentWidth}px` : '0px';
    const transition = isResizing ? 'none' : 'padding-right 0.3s ease-out, margin-right 0.3s ease-out';
    
    // Adjust body padding (more reliable than margin for overflow)
    document.body.style.paddingRight = marginValue;
    document.body.style.transition = transition;
    
    // Also adjust main content containers that might be used by React Admin
    // Try common selectors for main content areas
    const mainContentSelectors = [
      '#root > div',
      'main',
      '[role="main"]',
      '.MuiContainer-root',
      '.ra-layout-content',
      '.ra-layout',
    ];
    
    const adjustedElements: HTMLElement[] = [];
    
    mainContentSelectors.forEach(selector => {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      elements.forEach(el => {
        // Only adjust if it's a direct child of body or within a reasonable container
        if (el.offsetParent !== null) {
          const originalPadding = el.style.paddingRight || '';
          const originalMargin = el.style.marginRight || '';
          
          el.style.paddingRight = marginValue;
          el.style.marginRight = marginValue;
          el.style.transition = transition;
          
          adjustedElements.push(el);
          
          // Store original values for cleanup
          if (!el.dataset.tmOriginalPadding) {
            el.dataset.tmOriginalPadding = originalPadding;
            el.dataset.tmOriginalMargin = originalMargin;
          }
        }
      });
    });

    return () => {
      document.body.style.paddingRight = '';
      document.body.style.marginRight = '';
      document.body.style.transition = '';
      
      // Restore original values
      adjustedElements.forEach(el => {
        el.style.paddingRight = el.dataset.tmOriginalPadding || '';
        el.style.marginRight = el.dataset.tmOriginalMargin || '';
        el.style.transition = '';
        delete el.dataset.tmOriginalPadding;
        delete el.dataset.tmOriginalMargin;
      });
    };
  }, [isOpen, currentWidth, isResizing]);

  // Cleanup resize state when component unmounts
  useEffect(() => {
    return () => {
      if (isResizingRef.current) {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        isResizingRef.current = false;
      }
    };
  }, []);

  // SSR guard - don't render until mounted
  if (!portalElement || typeof document === 'undefined') {
    return null;
  }

  const overlayContent = (
    <div className="tm-overlay-root">
      <HighlightScanner enabled={enableHighlighting} />
      
      {/* Toggle Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleChat();
        }}
        onMouseDown={(e) => {
          // Prevent event bubbling
          e.stopPropagation();
        }}
        className={cn(
          'fixed z-40 p-4 rounded-full bg-chat-primary hover:bg-chat-primary-hover',
          'text-white shadow-lg transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-chat-primary focus:ring-offset-2',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        style={{
          // Critical inline styles to ensure visibility even without Tailwind
          position: 'fixed',
          zIndex: 2147483001,
          bottom: '24px',
          right: isOpen ? `${currentWidth + 24}px` : '24px',
          width: '56px',
          height: '56px',
          minWidth: '56px',
          minHeight: '56px',
          padding: '0',
          margin: '0',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isResizing ? 'none' : 'all 0.3s ease-out',
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
          // Force these styles with !important via inline styles
          background: '#3b82f6',
          backgroundImage: 'none',
          isolation: 'isolate',
        } as React.CSSProperties}
        aria-label="Toggle chat"
        type="button"
        onMouseEnter={(e) => {
          if (!isOpen) {
            const el = e.currentTarget as HTMLElement;
            el.style.setProperty('background-color', '#2563eb', 'important');
            el.style.setProperty('background', '#2563eb', 'important');
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            const el = e.currentTarget as HTMLElement;
            el.style.setProperty('background-color', '#3b82f6', 'important');
            el.style.setProperty('background', '#3b82f6', 'important');
          }
        }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{
            width: '24px',
            height: '24px',
            minWidth: '24px',
            minHeight: '24px',
            display: 'block',
            flexShrink: 0,
            color: 'white',
            stroke: 'white',
          } as React.CSSProperties}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Chat Panel - full height, but behind header */}
      <div
        className={cn(
          'fixed top-0 right-0 h-screen shadow-2xl z-10',
          'flex flex-col transition-transform duration-300 ease-out',
          isResizing && 'transition-none',
          theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        )}
        style={{
          width: `${currentWidth}px`,
          // Critical inline styles to ensure visibility even without Tailwind
          position: 'fixed',
          top: '0',
          right: '0',
          height: '100vh',
          zIndex: 2147483000,
          display: isOpen ? 'flex' : 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          WebkitTransform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: isResizing ? 'none' : 'transform 0.3s ease-out',
          paddingTop: '0px',
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#111827',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          pointerEvents: isOpen ? 'auto' : 'none',
          isolation: 'isolate',
        } as React.CSSProperties}
        ref={panelRef}
      >
        {/* Resize Handle */}
        {resizable && (
          <div
            className={cn(
              'absolute left-0 bottom-0 cursor-ew-resize',
              'hover:bg-chat-primary/50 transition-colors',
              isResizing && 'bg-chat-primary'
            )}
            style={{
              top: '0px',
              left: '0',
              bottom: '0',
              width: '4px',
              minWidth: '4px',
              zIndex: 1000,
              cursor: 'ew-resize',
              position: 'absolute',
              pointerEvents: 'auto',
              userSelect: 'none',
              touchAction: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
            } as React.CSSProperties}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[TaskMapr] Resize handle mousedown');
              handleResizeStart(e);
            }}
            onDragStart={(e) => {
              e.preventDefault();
              return false;
            }}
            draggable={false}
          >
            {/* Invisible wider hit area - extends left for easier grabbing */}
            <div
              style={{
                position: 'absolute',
                left: '-8px',
                top: '0',
                bottom: '0',
                width: '16px',
                cursor: 'ew-resize',
                pointerEvents: 'auto',
                zIndex: 1001,
              } as React.CSSProperties}
            />
          </div>
        )}
        
        {/* Header */}
        <div 
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b",
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-100 border-gray-300'
          )}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
            color: theme === 'dark' ? '#ffffff' : '#111827',
          } as React.CSSProperties}
        >
          <h2 
            className="text-lg font-semibold"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
              padding: 0,
            } as React.CSSProperties}
          >
            {title}
          </h2>
          <div 
            className="flex items-center gap-2"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            } as React.CSSProperties}
          >
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
                theme === 'dark' 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-200'
              )}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleChat();
              }}
              type="button"
              className={cn(
                "p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
                theme === 'dark' 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-200'
              )}
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <MessageList 
          messages={messages} 
          showTimestamps={showTimestamps} 
          enableHighlighting={enableHighlighting}
          theme={theme}
          isLoading={isLoading}
          streamingMessageId={streamingMessageIdRef.current}
        />

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          placeholder={placeholder}
          disabled={isLoading}
          theme={theme}
        />
      </div>
    </div>
  );

  return createPortal(overlayContent, portalElement);
};
