// src/components/action-plan/modules/InvestmentSavingsModule.tsx
'use client';

import { ChatLayout } from "@/components/chat/ChatLayout";
import { type ChatMessage } from "@/store/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import useUserStore from "@/store/userStore";
import { ChatInput } from "@/components/chat/ChatInput";
import { streamFlow } from '@genkit-ai/next/client';

interface Props {
  onComplete: () => void;
}

export function InvestmentSavingsModule({ onComplete }: Props) {
  const { userData } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const getInitialMessage = async () => {
      setIsLoadingAssistant(true);
      try {
        const result = streamFlow({
          url: '/api/investmentSavingsFlow', // Apuntamos al nuevo endpoint
          input: { history: [], userData: userData }
        });
        const assistantMessageId = 'init-stream-investment';
        
        if (isMounted) {
          setMessages([{ role: 'assistant', content: '', id: assistantMessageId, timestamp: new Date() }]);
        }

        for await (const chunk of result.stream) {
          if (isMounted) {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId ? { ...msg, content: (msg.content ?? "") + chunk } : msg
            ));
          } else {
            break;
          }
        }
      } catch (error) {
        if (isMounted) console.error("Error fetching initial message:", error);
      } finally {
        if (isMounted) setIsLoadingAssistant(false);
      }
    };
    getInitialMessage();
    return () => { isMounted = false; };
  }, [userData]); // Añadimos userData como dependencia por si cambia

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoadingAssistant) return;

    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: messageContent, timestamp: new Date() };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setIsLoadingAssistant(true);

    try {
      const historyForFlow = newMessages.map(m => ({ role: m.role, content: m.content }));
      const result = streamFlow({
        url: '/api/investmentSavingsFlow', // Apuntamos al nuevo endpoint
        input: { history: historyForFlow, userData: userData }
      });
      
      const assistantMessageId = Date.now().toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date() }]);

      for await (const chunk of result.stream) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, content: (msg.content ?? "") + chunk } : msg
        ));
      }
    } catch (error) {
      console.error("Error streaming action:", error);
    } finally {
      setIsLoadingAssistant(false);
    }
  };

  const chatInputComponent = (
    <ChatInput
      onSendMessage={handleSendMessage}
      isLoading={isLoadingAssistant}
    />
  );

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Objetivo: Ahorro para Inversiones</h2>
          <p className="text-sm text-muted-foreground">¡Hola, {userData?.name}! Un gran paso. Hablemos sobre cómo empezar a invertir.</p>
      </div>
      <ChatLayout
        messages={messages}
        isLoadingAssistant={isLoadingAssistant}
        inputComponent={chatInputComponent}
      />
      <div className="p-4 mt-auto border-t">
          <Button onClick={onComplete} variant="secondary" className="w-full">Terminar con este objetivo por ahora</Button>
      </div>
    </div>
  );
}