
"use client";

import { useState, useEffect } from 'react';
import type { ChatMessage } from '@/store/types';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { InfoPanel } from '@/components/info-panel/InfoPanel';
import { ChatInput } from '@/components/chat/ChatInput';
import { ObjectivesSelection } from '@/components/chat/ObjectivesSelection';
import { generateChatResponse, type GenerateChatResponseInput, type UserData, type GenerateChatResponseOutput } from '@/ai/flows/generate-chat-response';
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(false);
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData>({ name: undefined, objectives: [] });
  const [showObjectivesSelection, setShowObjectivesSelection] = useState(false);
  const [nextInputHint, setNextInputHint] = useState<GenerateChatResponseOutput['nextExpectedInput'] | undefined>(undefined);

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

  useEffect(() => {
    if (nextInputHint === 'objectives_selection' && !isLoadingAssistant) {
      setShowObjectivesSelection(true);
    } else {
      setShowObjectivesSelection(false);
    }
  }, [nextInputHint, isLoadingAssistant]);

  const handleSendMessage = async (content: string, isObjectiveSubmission: boolean = false) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoadingAssistant(true);
    if (isObjectiveSubmission) { // If submitting objectives, ensure the selector is hidden
        setShowObjectivesSelection(false);
    }


    try {
      const chatHistoryForFlow = currentMessages.slice(-10).map(msg => ({
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
      if (aiResponse.nextExpectedInput) {
        setNextInputHint(aiResponse.nextExpectedInput);
      } else {
        setNextInputHint('general_conversation'); 
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

  const handleObjectivesSubmit = async (selectedObjectives: string[]) => {
    if (selectedObjectives.length === 0) {
      toast({
        variant: "destructive",
        title: "Selección Requerida",
        description: "Por favor, selecciona al menos un objetivo.",
      });
      return;
    }
    // Format a message as if the user typed it, to be processed by the AI
    const objectivesMessage = `Mis objetivos financieros seleccionados son: ${selectedObjectives.join(', ')}.`;
    // Pass true to indicate this is an objective submission
    await handleSendMessage(objectivesMessage, true); 
  };


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-2 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl h-[calc(100vh-2rem)] md:h-[700px]">
        <div className="md:col-span-2 h-full">
          <ChatLayout
            messages={messages}
            isLoadingAssistant={isLoadingAssistant}
            inputComponent={
              showObjectivesSelection ? (
                <ObjectivesSelection
                  onObjectivesSubmit={handleObjectivesSubmit}
                  isLoading={isLoadingAssistant}
                />
              ) : (
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoadingAssistant}
                />
              )
            }
          />
        </div>
        <div className="md:col-span-1 h-full md:h-[700px] overflow-y-auto flex flex-col gap-4">
          <InfoPanel userData={userData} />
        </div>
      </div>
    </main>
  );
}

    