import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  const [currentWidth, setCurrentWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Configuration with defaults
  const title = overlayConfig?.title || 'Chat';
  const placeholder = overlayConfig?.placeholder || 'Type a message...';
  const showTimestamps = overlayConfig?.showTimestamps ?? true;
  const enableHighlighting = overlayConfig?.enableHighlighting ?? true;
  const resizable = true;
  const minWidthPx = 280;
  const maxWidthPx = 600;

  // Handle sending messages - fully internal
  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
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
      
      try {
        // Use client to send message
        const response = await client.sendMessage(content);
        setMessages((prev) => [...prev, response]);
        
        // Call lifecycle hook if provided
        if (clientConfig.onMessageReceived) {
          clientConfig.onMessageReceived(response);
        }
      } catch (error) {
        console.error('TaskMapr error:', error);
        
        // Call error handler if provided
        if (clientConfig.onError && error instanceof Error) {
          clientConfig.onError(error);
        }
        
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Sorry, encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [client, clientConfig]
  );

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const toggleTheme = () => {
    setTheme((prev) => prev === 'dark' ? 'light' : 'dark');
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = currentWidth;
  };

  // Handle body margin to push content
  useEffect(() => {
    if (isOpen) {
      document.body.style.marginRight = `${currentWidth}px`;
      document.body.style.transition = isResizing ? 'none' : 'margin-right 0.3s ease-out';
    } else {
      document.body.style.marginRight = '0px';
      document.body.style.transition = 'margin-right 0.3s ease-out';
    }

    return () => {
      document.body.style.marginRight = '0px';
      document.body.style.transition = '';
    };
  }, [isOpen, currentWidth, isResizing]);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartX.current - e.clientX;
      const newWidth = Math.min(
        Math.max(resizeStartWidth.current + deltaX, minWidthPx),
        maxWidthPx
      );
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidthPx, maxWidthPx]);

  return (
    <>
      <HighlightScanner enabled={enableHighlighting} />
      
      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className={cn(
          'fixed z-40 p-4 rounded-full bg-chat-primary hover:bg-chat-primary-hover',
          'text-white shadow-lg transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-chat-primary focus:ring-offset-2',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        style={{
          bottom: '24px',
          right: isOpen ? `${currentWidth + 24}px` : '24px',
          transition: isResizing ? 'none' : 'all 0.3s ease-out',
        }}
        aria-label="Toggle chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
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
          'fixed top-0 right-0 h-screen shadow-2xl z-10',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          isResizing && 'transition-none',
          'pt-[72px]', // Add padding for header
          theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        )}
        style={{ width: `${currentWidth}px` }}
      >
        {/* Resize Handle */}
        {resizable && (
          <div
            className={cn(
              'absolute left-0 bottom-0 w-1 cursor-ew-resize',
              'hover:bg-chat-primary/50 transition-colors',
              isResizing && 'bg-chat-primary'
            )}
            style={{ top: '72px' }}
            onMouseDown={handleResizeStart}
          >
            <div className="absolute left-0 top-0 bottom-0 w-4 -translate-x-1.5" />
          </div>
        )}
        
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-b",
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-100 border-gray-300'
        )}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
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
              onClick={toggleChat}
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
        />

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          placeholder={placeholder}
          disabled={isLoading}
          theme={theme}
        />
      </div>
    </>
  );
};
