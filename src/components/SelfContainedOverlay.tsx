import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Message } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { HighlightScanner } from './HighlightScanner';
import { useTaskMaprClient } from '../contexts/TaskMaprContext';
import { cn } from '../utils/cn';

/**
 * Self-contained overlay that manages its own message state.
 * Gets configuration from TaskMaprClient via context.
 * No need to pass messages or handlers from parent.
 */
export const SelfContainedOverlay: React.FC = () => {
  const client = useTaskMaprClient();
  const overlayConfig = client.getOverlayConfig();
  const clientConfig = client.getConfig();
  
  // Internal message state - fully managed by this component
  const [messages, setMessages] = useState<Message[]>(
    clientConfig.initialMessages || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    overlayConfig?.defaultTheme || 'light'
  );
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

  useEffect(() => {
    if (!portalElement) {
      return;
    }

    portalElement.setAttribute('data-tm-theme', theme);
    return () => {
      portalElement.removeAttribute('data-tm-theme');
    };
  }, [portalElement, theme]);

  // Configuration with defaults
  const title = overlayConfig?.title || 'Chat';
  const placeholder = overlayConfig?.placeholder || 'Type a message...';
  const showTimestamps = overlayConfig?.showTimestamps ?? true;
  const enableHighlighting = overlayConfig?.enableHighlighting ?? true;
  const resizable = true;
  const minWidthPx = 320;
  const maxWidthPx = 640;

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

  // Use ref to access panel element for dynamic width
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (isOpen) {
      root.classList.add('taskmapr-overlay-open');
    } else {
      root.classList.remove('taskmapr-overlay-open');
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    const widthValue = isOpen ? `${currentWidth}px` : '0px';
    root.style.setProperty('--taskmapr-overlay-width', widthValue);
  }, [isOpen, currentWidth]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    return () => {
      root.classList.remove('taskmapr-overlay-open');
      root.style.removeProperty('--taskmapr-overlay-width');
    };
  }, []);

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
    <div className="tm-overlay-root" data-tm-theme={theme}>
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
          'tm-launcher',
          isOpen && 'tm-launcher--hidden'
        )}
        style={{
          right: isOpen ? `${currentWidth + 24}px` : '24px',
          transition: isResizing ? 'none' : undefined,
        } as React.CSSProperties}
        aria-label="Toggle chat"
        type="button"
      >
        <svg
          className="tm-launcher__icon"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
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
          'tm-sidebar',
          isOpen && 'tm-sidebar--open',
          isResizing && 'tm-sidebar--resizing',
          theme === 'dark' ? 'tm-sidebar--dark' : 'tm-sidebar--light'
        )}
        style={{
          width: `${currentWidth}px`,
        } as React.CSSProperties}
        ref={panelRef}
        data-tm-open={isOpen}
        data-tm-resizing={isResizing}
      >
        {/* Resize Handle */}
        {resizable && (
          <div
            className={cn(
              'tm-sidebar__resize-handle',
              isResizing && 'tm-sidebar__resize-handle--active'
            )}
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
            <div className="tm-sidebar__resize-handle-hit-area" />
          </div>
        )}
        
        {/* Header */}
        <div className="tm-sidebar__header">
          <h2 className="tm-sidebar__title">
            {title}
          </h2>
          <div className="tm-sidebar__header-actions">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="tm-sidebar__header-button tm-sidebar__header-button--theme"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="tm-sidebar__header-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="tm-sidebar__header-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="tm-sidebar__header-button tm-sidebar__header-button--close"
              aria-label="Close chat"
            >
              <svg
                className="tm-sidebar__header-button-icon"
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
        <div className="tm-sidebar__messages">
          <MessageList 
            messages={messages} 
            showTimestamps={showTimestamps} 
            enableHighlighting={enableHighlighting}
            theme={theme}
            isLoading={isLoading}
            streamingMessageId={streamingMessageIdRef.current}
          />
        </div>

        {/* Input */}
        <div className="tm-sidebar__input">
          <MessageInput
            onSend={handleSendMessage}
            placeholder={placeholder}
            disabled={isLoading}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, portalElement);
};
