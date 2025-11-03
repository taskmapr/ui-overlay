import React, { useEffect, useRef, useCallback } from 'react';
import { MessageListProps, Message } from '../types';
import { useHighlight } from '../contexts/HighlightContext';
import { cn } from '../utils/cn';

export const MessageList: React.FC<MessageListProps> = ({ messages, showTimestamps = false, enableHighlighting = true, theme = 'dark' }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { highlight, highlightComponent } = useHighlight();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectAndHighlightComponents = useCallback((message: Message) => {
    const defaultDuration = 5000;
    
    // If message has explicit highlight selectors, use those
    if (message.highlight && message.highlight.length > 0) {
      console.log('Processing explicit highlights:', message.highlight);
      setTimeout(() => {
        message.highlight!.forEach(({ selector, duration }) => {
          console.log('Calling highlight for selector:', selector);
          highlight(selector, duration);
        });
      }, 100);
      return;
    }

    // Only auto-detect from user messages (not assistant instructions)
    if (message.role !== 'user') {
      return;
    }

    // Try to detect component names in the user's message
    const content = message.content.toLowerCase().trim();
    
    console.log('Analyzing message:', content);

    // Strategy: Just try to match the entire message or parts of it
    // against registered components by name/keywords
    const queries = new Set<string>();
    
    // Add the full message as a query
    queries.add(content);
    
    // Common patterns to extract specific references
    const patterns = [
      /highlight\s+(?:the\s+)?([\w\s]+?)(?:\s+section)?(?:[.!?]|$)/gi,
      /show\s+(?:me\s+)?(?:the\s+)?([\w\s]+?)(?:\s+section)?(?:[.!?]|$)/gi,
      /(?:what|where)\s+(?:is|are)\s+(?:the\s+)?([\w\s]+?)(?:\s+section)?(?:[?.!]|$)/gi,
      /"([^"]+)"/g, // Quoted text
      /\*\*([^*]+)\*\*/g, // Bold markdown
    ];
    
    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          queries.add(match[1].trim());
        }
      }
    });

    // Also try individual words for short messages
    if (content.split(/\s+/).length <= 3) {
      content.split(/\s+/).forEach(word => {
        if (word.length > 2) { // Skip very short words
          queries.add(word);
        }
      });
    }

    console.log('Trying queries:', Array.from(queries));

    // Try to highlight using each query
    let highlighted = false;
    setTimeout(() => {
      queries.forEach(query => {
        const success = highlightComponent(query, defaultDuration);
        if (success) {
          console.log('Successfully highlighted with query:', query);
          highlighted = true;
        }
      });
      
      if (!highlighted) {
        console.log('No components matched for message:', content);
      }
    }, 100);
  }, [highlight, highlightComponent]);

  useEffect(() => {
    scrollToBottom();
    
    // Trigger highlights for the latest message if enabled
    if (enableHighlighting && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      console.log('Latest message:', latestMessage);
      detectAndHighlightComponents(latestMessage);
    }
  }, [messages, enableHighlighting, detectAndHighlightComponents]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className={cn(
          "flex items-center justify-center h-full",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          <p className="text-sm">No messages yet. Start a conversation!</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col gap-1',
                message.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'assistant'
                    ? theme === 'dark' 
                      ? 'bg-gray-800 text-gray-100 border border-gray-700'
                      : 'bg-gray-100 text-gray-900 border border-gray-300'
                    : theme === 'dark'
                    ? 'bg-gray-800 text-gray-400 border border-gray-700'
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                )}
              >
                {message.role === 'system' && (
                  <div className="text-xs font-semibold mb-1 uppercase tracking-wide">
                    System
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
              {showTimestamps && (
                <span className={cn(
                  "text-xs px-1",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {formatTime(message.timestamp)}
                </span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};
