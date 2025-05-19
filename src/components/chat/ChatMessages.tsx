"use client";

import type { ChatMessage } from '@/store/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageItem } from './ChatMessageItem';
import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react'; // For typing indicator

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoadingAssistant: boolean;
}

export function ChatMessages({ messages, isLoadingAssistant }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoadingAssistant]);

  return (
    <ScrollArea className="h-full w-full" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="p-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        {isLoadingAssistant && (
          <div className="flex items-start gap-3 p-4 justify-start">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted-foreground/20">
                <Bot className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <div className="max-w-[70%] rounded-lg p-3 shadow-sm bg-muted text-foreground rounded-bl-none">
              <p className="text-sm italic text-muted-foreground">FinanceFriend is typing...</p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
