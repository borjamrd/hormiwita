"use client";

import type { ChatMessage } from '@/store/types';
import { cn } from '@/lib/utils';
import { ChatAvatar } from './ChatAvatar';
import { format } from 'date-fns';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && <ChatAvatar role="assistant" />}
      <div
        className={cn(
          'max-w-[70%] rounded-lg p-3 shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted text-foreground rounded-bl-none'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-xs',
            isUser ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'
          )}
        >
          {format(message.timestamp, 'HH:mm')}
        </p>
      </div>
      {isUser && <ChatAvatar role="user" />}
    </div>
  );
}
