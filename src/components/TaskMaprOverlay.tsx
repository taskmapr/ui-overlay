import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TaskMaprOverlayProps, Message } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { HighlightScanner } from './HighlightScanner';
import { cn } from '../utils/cn';

export const TaskMaprOverlay: React.FC<TaskMaprOverlayProps> = ({
  title = 'Chat',
  placeholder = 'Type a message...',
  initialMessages = [],
  onSendMessage,
  width = '360px',
  minWidth = '320px',
  maxWidth = '640px',
  resizable = true,
  defaultOpen = false,
  toggleButtonBottom = '24px',
  toggleButtonRight = '24px',
  showTimestamps = false,
  className,
  enableHighlighting = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with external messages state
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);
  const [currentWidth, setCurrentWidth] = useState(parseInt(width));
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const minWidthPx = parseInt(minWidth);
  const maxWidthPx = parseInt(maxWidth);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      if (onSendMessage) {
        setIsLoading(true);
        try {
          await onSendMessage(content);
        } catch (error) {
          console.error('Error sending message:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [onSendMessage]
  );

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = currentWidth;
  };

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
    <div className="tm-overlay-root">
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
          bottom: toggleButtonBottom,
          right: isOpen ? `${currentWidth + 24}px` : toggleButtonRight,
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

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-screen bg-chat-bg shadow-2xl z-30',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          isResizing && 'transition-none',
          className
        )}
        style={{ width: `${currentWidth}px` }}
      >
        {/* Resize Handle */}
        {resizable && (
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize',
              'hover:bg-chat-primary/50 transition-colors',
              isResizing && 'bg-chat-primary'
            )}
            onMouseDown={handleResizeStart}
          >
            <div className="absolute left-0 top-0 bottom-0 w-4 -translate-x-1.5" />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-chat-border bg-chat-surface">
          <h2 className="text-lg font-semibold text-chat-text">{title}</h2>
          <button
            onClick={toggleChat}
            className="p-1 rounded hover:bg-chat-bg transition-colors focus:outline-none focus:ring-2 focus:ring-chat-primary"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5 text-chat-text"
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

        {/* Messages */}
        <MessageList messages={messages} showTimestamps={showTimestamps} enableHighlighting={enableHighlighting} />

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          placeholder={placeholder}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};
