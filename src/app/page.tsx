
"use client";

import { useState, useEffect } from 'react';
import type { ChatMessage } from '@/store/types';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { InfoPanel } from '@/components/info-panel/InfoPanel';
import { generateChatResponse, type GenerateChatResponseInput, type UserData } from '@/ai/flows/generate-chat-response';
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(false);
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData>({ name: undefined, objectives: [] });

  useEffect(() => {
    // Initial greeting message from the assistant
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Hola! Soy FinanceFriend, tu asistente personal de finanzas y banca. ¿En qué puedo ayudarte hoy?',
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
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoadingAssistant(true);

    try {
      // Prepare chat history for the flow
      const chatHistoryForFlow = currentMessages.slice(-10).map(msg => ({ // Send last 10 messages
        role: msg.role,
        content: msg.content,
      }));

      const flowInput: GenerateChatResponseInput = {
        query: content,
        chatHistory: chatHistoryForFlow,
        userData: userData,
      };

      const aiResponse = await generateChatResponse(flowInput);

      if (aiResponse.updatedUserData) {
        setUserData(prevData => ({ ...prevData, ...aiResponse.updatedUserData }));
      }

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
        description: "Lo siento, no pude procesar tu solicitud. Por favor, inténtalo de nuevo.",
      });
       const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Me disculpo, pero encontré un error al intentar responder. Por favor, inténtalo más tarde.",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoadingAssistant(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-2 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl h-[calc(100vh-2rem)] md:h-[700px]">
        <div className="md:col-span-2 h-full">
          <ChatLayout
            messages={messages}
            isLoadingAssistant={isLoadingAssistant}
            onSendMessage={handleSendMessage}
          />
        </div>
        <div className="md:col-span-1 h-full md:h-[700px] overflow-y-auto flex flex-col gap-4">
          <InfoPanel userData={userData} />
        </div>
      </div>
    </main>
  );
}
