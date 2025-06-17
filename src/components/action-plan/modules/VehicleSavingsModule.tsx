// src/components/action-plan/modules/VehicleSavingsModule.tsx
"use client";

import { ChatLayout } from "@/components/chat/ChatLayout";
import { type ChatMessage } from "@/store/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import useUserStore from "@/store/userStore";
import { ChatInput } from "@/components/chat/ChatInput";
import { streamFlow } from "@genkit-ai/next/client";

interface Props {
  onComplete: () => void;
}

export function VehicleSavingsModule({ onComplete }: Props) {
  const { userData } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(true);

  useEffect(() => {
    const getInitialMessage = async () => {
      setIsLoadingAssistant(true);
      try {
        const result = streamFlow({
          url: "/api/vehicleSavingsFlow",
          input: { history: [] },
        });
        const assistantMessageId = "init-stream";
        setMessages([
          {
            role: "assistant",
            content: "",
            id: assistantMessageId,
            timestamp: new Date(),
          },
        ]);

        for await (const chunk of result.stream) {
          console.log({chunk})
          setMessages((prev) =>
            prev
              .filter(Boolean)
              .map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: (msg.content ?? "") + chunk }
                  : msg
              )
          );
        }
      } catch (error) {
        console.error("Error fetching initial message:", error);
      } finally {
        setIsLoadingAssistant(false);
      }
    };
    getInitialMessage();
  }, []);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoadingAssistant) return;

    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: messageContent, timestamp: new Date() };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    // ELIMINAMOS: setInput(""), ChatInput se limpia solo
    setIsLoadingAssistant(true);

    try {
      const historyForFlow = newMessages.map(m => ({ role: m.role, content: m.content }));
      const result = streamFlow({
        url: '/api/vehicleSavingsFlow',
        input: { history: historyForFlow }
      });
      
      const assistantMessageId = Date.now().toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date() }]);

      for await (const chunk of result.stream) {
        setMessages(prev =>
          prev.filter(Boolean).map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: (msg.content ?? "") + chunk } 
              : msg
          )
        );
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
  // Esta es la estructura visual correcta que tú mencionaste
  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Objetivo: Ahorro para Vehículo</h2>
        <p className="text-sm text-muted-foreground">
          ¡Hola, {userData?.name}! Hablemos sobre cómo conseguir ese coche.
        </p>
      </div>
      <ChatLayout
        messages={messages}
        isLoadingAssistant={isLoadingAssistant}
        inputComponent={chatInputComponent}
      />
      <div className="p-4 mt-auto border-t">
        <Button onClick={onComplete} variant="secondary" className="w-full">
          Terminar con este objetivo por ahora
        </Button>
      </div>
    </div>
  );
}
