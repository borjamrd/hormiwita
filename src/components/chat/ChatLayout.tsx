
"use client";

import type { ChatMessage } from '@/store/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ChatMessages } from './ChatMessages';
// ChatInput is no longer directly imported here, it will be passed as a prop
import Image from 'next/image'; // Import next/image
import type React from 'react';

interface ChatLayoutProps {
  messages: ChatMessage[];
  isLoadingAssistant: boolean;
  inputComponent: React.ReactNode; // New prop for the input area
}

export function ChatLayout({ messages, isLoadingAssistant, inputComponent }: ChatLayoutProps) {
  return (
    <Card className="w-full h-full flex flex-col shadow-xl rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          {/* Replace MessageSquareText with the new logo */}
          <Image 
            src="/hormiguita_logo.png" 
            alt="hormiwita logo" 
            width={36} // Adjust width as needed
            height={36} // Adjust height as needed
            priority // Optional: if logo is critical for LCP
          />
          <h1 className="text-xl font-semibold text-foreground">hormiwita</h1>
        </div>
        {/* Placeholder for future elements like settings or user avatar */}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 bg-background">
        <ChatMessages messages={messages} isLoadingAssistant={isLoadingAssistant} />
      </CardContent>
      <CardFooter className="p-4 border-t bg-card">
        {inputComponent} {/* Render the passed input component */}
      </CardFooter>
    </Card>
  );
}

    
