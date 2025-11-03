import React, { useState, KeyboardEvent } from 'react';
import { MessageInputProps } from '../types';
import { cn } from '../utils/cn';

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  theme = 'dark',
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
    <div className={cn(
      "border-t p-4",
      theme === 'dark' 
        ? 'border-gray-700 bg-gray-800' 
        : 'border-gray-300 bg-gray-100'
    )}>
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-md border',
            'px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-32 overflow-y-auto',
            theme === 'dark'
              ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
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
            'px-4 py-2 rounded-md bg-blue-600 text-white font-medium',
            'hover:bg-blue-700 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-gray-100'
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
