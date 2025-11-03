import React, { useState, KeyboardEvent } from 'react';
import { MessageInputProps } from '../types';
import { cn } from '../utils/cn';

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-chat-border bg-chat-surface p-4">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-md bg-chat-bg border border-chat-border',
            'px-3 py-2 text-sm text-chat-text placeholder:text-chat-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-chat-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-32 overflow-y-auto'
          )}
          style={{
            minHeight: '38px',
            height: Math.min(38 + (message.split('\n').length - 1) * 20, 128) + 'px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'px-4 py-2 rounded-md bg-chat-primary text-white font-medium',
            'hover:bg-chat-primary-hover transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-chat-primary',
            'focus:outline-none focus:ring-2 focus:ring-chat-primary focus:ring-offset-2 focus:ring-offset-chat-surface'
          )}
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
