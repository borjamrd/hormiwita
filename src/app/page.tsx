
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { ChatMessage } from '@/store/types';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { InfoPanel } from '@/components/info-panel/InfoPanel';
import { ChatInput } from '@/components/chat/ChatInput';
import { ObjectivesSelection } from '@/components/chat/ObjectivesSelection';
import { UploadRecords } from '@/components/chat/UploadRecords';
import { generateChatResponse, type GenerateChatResponseInput, type UserData, type GenerateChatResponseOutput } from '@/ai/flows/generate-chat-response';
import type { BankStatementSummary } from '@/ai/flows/analyze-bank-statements';
import { useToast } from "@/hooks/use-toast";

const generalObjectivesOptions = [
  "Ahorro",
  "Reducción y Gestión de Deuda",
  "Gestión de Gastos",
  "Crecimiento Financiero"
];

const specificObjectivesMap: Record<string, string[]> = {
  "Ahorro": [
    "Fondo de Emergencia",
    "Ahorro para la Jubilación",
    "Ahorro para la Entrada de una Vivienda",
    "Ahorro para la Compra de un Vehículo",
    "Ahorro para Viajes/Vacaciones",
    "Ahorro para Educación",
    "Ahorro para Inversiones",
    "Ahorro para Compras Importantes",
    "Ahorro para Eventos Especiales",
  ],
  "Reducción y Gestión de Deuda": [
    "Pagar Deudas de Tarjetas de Crédito",
    "Amortizar Préstamos Personales",
    "Liquidar Préstamos Estudiantiles",
    "Reducir la Hipoteca",
    "Consolidar Deudas",
    "Eliminar Deudas Pequeñas (Método Bola de Nieve o Avalancha)",
  ],
  "Gestión de Gastos": [
    "Crear y Seguir un Presupuesto Mensual",
    "Reducir Gastos Hormiga",
    "Disminuir Gasto en Categorías Específicas",
    "Optimizar Gastos Fijos",
  ],
  "Crecimiento Financiero": [
    "Aumentar Ingresos",
    "Incrementar el Patrimonio Neto",
    "Alcanzar la Independencia Financiera",
  ],
};


export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(false);
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData>({ name: undefined, generalObjectives: [], specificObjectives: [], expensesIncomeSummary: undefined });
  const [nextInputHint, setNextInputHint] = useState<GenerateChatResponseOutput['nextExpectedInput'] | undefined>(undefined);

  const showGeneralObjectivesSelection = useMemo(() => nextInputHint === 'general_objectives_selection' && !isLoadingAssistant, [nextInputHint, isLoadingAssistant]);
  const showSpecificObjectivesSelection = useMemo(() => nextInputHint === 'specific_objectives_selection' && !isLoadingAssistant && (userData.generalObjectives?.length || 0) > 0, [nextInputHint, isLoadingAssistant, userData.generalObjectives]);
  const showUploadRecords = useMemo(() => nextInputHint === 'expense_income_upload' && !isLoadingAssistant, [nextInputHint, isLoadingAssistant]);


  useEffect(() => {
     triggerInitialAIQuery();
  }, []);

  const triggerInitialAIQuery = async () => {
    setIsLoadingAssistant(true);
    // Set a temporary initial greeting that will be replaced by AI's first question
    setMessages([
        {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Iniciando conversación...',
            timestamp: new Date(),
        },
    ]);
    try {
      const flowInput: GenerateChatResponseInput = {
        query: "", 
        chatHistory: [],
        userData: { name: undefined, generalObjectives: [], specificObjectives: [], expensesIncomeSummary: undefined },
      };
      const aiResponse = await generateChatResponse(flowInput);
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
      };
      setMessages([assistantMessage]);

      if (aiResponse.updatedUserData) {
        setUserData(prevData => ({ ...prevData, ...aiResponse.updatedUserData }));
      }
      setNextInputHint(aiResponse.nextExpectedInput || 'general_conversation');

    } catch (error) {
       console.error("Error during initial AI query:", error);
       toast({
        variant: "destructive",
        title: "Error de Inicialización",
        description: "No pude iniciar la conversación correctamente. Por favor, recarga la página.",
      });
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al iniciar. Por favor, intenta recargar.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoadingAssistant(false);
    }
  };


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
    // Optimistically set hint to general conversation to hide special inputs
    // It will be updated by the AI's response
    setNextInputHint('general_conversation');


    try {
      const chatHistoryForFlow = currentMessages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant', 
        content: msg.content,
      }));
      
      const flowInput: GenerateChatResponseInput = {
        query: content,
        chatHistory: chatHistoryForFlow,
        userData: userData, 
      };

      const aiResponse = await generateChatResponse(flowInput);

      if (aiResponse.updatedUserData) {
        setUserData(prevData => {
            const newData = { ...prevData, ...aiResponse.updatedUserData };
            if (aiResponse.updatedUserData?.generalObjectives === undefined && prevData.generalObjectives) {
                newData.generalObjectives = prevData.generalObjectives;
            }
            if (aiResponse.updatedUserData?.specificObjectives === undefined && prevData.specificObjectives) {
                newData.specificObjectives = prevData.specificObjectives;
            }
            if (aiResponse.updatedUserData?.expensesIncomeSummary === undefined && prevData.expensesIncomeSummary) {
                newData.expensesIncomeSummary = prevData.expensesIncomeSummary;
            }
            return newData;
        });
      }
      setNextInputHint(aiResponse.nextExpectedInput || 'general_conversation'); 

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

  const handleGeneralObjectivesSubmit = async (selectedObjectives: string[]) => {
    if (selectedObjectives.length === 0) {
      toast({
        variant: "destructive",
        title: "Selección Requerida",
        description: "Por favor, selecciona al menos un objetivo general.",
      });
      return;
    }
    const objectivesMessage = `Mis objetivos generales seleccionados son: ${selectedObjectives.join(', ')}.`;
    await handleSendMessage(objectivesMessage); 
  };

  const handleSpecificObjectivesSubmit = async (selectedObjectives: string[]) => {
    const objectivesMessage = selectedObjectives.length > 0 
      ? `Mis objetivos concretos seleccionados son: ${selectedObjectives.join(', ')}.`
      : "No tengo objetivos concretos adicionales por ahora para los generales ya mencionados.";
    await handleSendMessage(objectivesMessage);
  };
  
  const handleAnalysisConfirmed = async (summary: BankStatementSummary) => {
    setUserData(prevData => ({
      ...prevData,
      expensesIncomeSummary: summary,
    }));

    const summaryMessage = `He subido mis extractos. El feedback del análisis es: "${summary.feedback}" (Estado: ${summary.status}).`;
    await handleSendMessage(summaryMessage);
  };


  const getSpecificObjectiveOptions = (selectedGeneral: string[] | undefined): string[] => {
    if (!selectedGeneral || selectedGeneral.length === 0) return [];
    let options: string[] = [];
    selectedGeneral.forEach(general => {
      if (specificObjectivesMap[general]) {
        options = [...options, ...specificObjectivesMap[general]];
      }
    });
    return Array.from(new Set(options)); 
  };

  const currentSpecificOptions = useMemo(() => getSpecificObjectiveOptions(userData.generalObjectives), [userData.generalObjectives]);

  const inputComponentToRender = () => {
    if (showUploadRecords) {
      return <UploadRecords onAnalysisConfirmed={handleAnalysisConfirmed} isLoadingConversation={isLoadingAssistant} />;
    }
    if (showSpecificObjectivesSelection) {
      return (
        <ObjectivesSelection
          title="Selecciona tus objetivos concretos (opcional):"
          options={currentSpecificOptions}
          onObjectivesSubmit={handleSpecificObjectivesSubmit}
          isLoading={isLoadingAssistant}
          allowEmptySubmission={true} 
        />
      );
    }
    if (showGeneralObjectivesSelection) {
      return (
        <ObjectivesSelection
          title="Selecciona tus principales objetivos generales:"
          options={generalObjectivesOptions}
          onObjectivesSubmit={handleGeneralObjectivesSubmit}
          isLoading={isLoadingAssistant}
        />
      );
    }
    return (
      <ChatInput
        onSendMessage={(msg) => handleSendMessage(msg)}
        isLoading={isLoadingAssistant}
      />
    );
  };


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-2 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl h-[calc(100vh-2rem)] md:h-[700px]">
        <div className="md:col-span-2 h-full">
          <ChatLayout
            messages={messages}
            isLoadingAssistant={isLoadingAssistant}
            inputComponent={inputComponentToRender()}
          />
        </div>
        <div className="md:col-span-1 h-full flex flex-col relative"> {/* Added md:sticky and md:top-4 */}
          <InfoPanel userData={userData} />
        </div>
      </div>
    </main>
  );
}
