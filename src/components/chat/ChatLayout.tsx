
"use client";

import type { ChatMessage } from '@/store/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { MessageSquareText } from 'lucide-react';

interface ChatLayoutProps {
  messages: ChatMessage[];
  isLoadingAssistant: boolean;
  onSendMessage: (messageContent: string) => void;
}

export function ChatLayout({ messages, isLoadingAssistant, onSendMessage }: ChatLayoutProps) {
  return (
    <Card className="w-full h-full flex flex-col shadow-xl rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-7 w-7 text-primary" data-ai-hint="logo finance"/>
          <h1 className="text-xl font-semibold text-foreground">FinanceFriend Chat</h1>
        </div>
        {/* Placeholder for future elements like settings or user avatar */}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 bg-background">
        <ChatMessages messages={messages} isLoadingAssistant={isLoadingAssistant} />
      </CardContent>
      <CardFooter className="p-4 border-t bg-card">
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoadingAssistant} />
      </CardFooter>
    </Card>
  );
}
