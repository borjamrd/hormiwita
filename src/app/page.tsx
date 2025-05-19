"use client";

import { useState, useEffect } from 'react';
import type { ChatMessage } from '@/store/types';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { generateChatResponse } from '@/ai/flows/generate-chat-response';
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initial greeting message from the assistant
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Hello! I am FinanceFriend, your personal finance and banking assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoadingAssistant(true);

    try {
      const aiResponse = await generateChatResponse({ query: content });
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error generating chat response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Sorry, I couldn't process your request. Please try again.",
      });
       const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I apologize, but I encountered an error trying to respond. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoadingAssistant(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-2 sm:p-4">
      <ChatLayout
        messages={messages}
        isLoadingAssistant={isLoadingAssistant}
        onSendMessage={handleSendMessage}
      />
    </main>
  );
}
