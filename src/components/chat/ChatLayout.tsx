"use client";

import type { ChatMessage } from "@/store/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { ChatMessages } from "./ChatMessages";
// ChatInput is no longer directly imported here, it will be passed as a prop
import Image from "next/image"; // Import next/image
import type React from "react";

interface ChatLayoutProps {
  messages: ChatMessage[];
  isLoadingAssistant: boolean;
  inputComponent: React.ReactNode; // New prop for the input area
}

export function ChatLayout({
  messages,
  isLoadingAssistant,
  inputComponent,
}: ChatLayoutProps) {
  return (
    <Card className="w-full h-full flex flex-col overflow-hidden border-none">
      <CardContent className="flex-1 max-h-[60vh] overflow-hidden p-0 bg-background">
        <ChatMessages
          messages={messages}
          isLoadingAssistant={isLoadingAssistant}
        />
      </CardContent>
      <CardFooter className="p-4 border-t bg-card">{inputComponent}</CardFooter>
    </Card>
  );
}
