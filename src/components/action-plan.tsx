"use client";

import { useState, useEffect, useRef } from "react";
import useUserStore, { type UserData } from "@/store/userStore";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  User,
  SendHorizontal,
  Loader2,
  FileJson,
  Lightbulb,
} from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ChatAvatar } from "./chat/ChatAvatar";
// We'll need a new Genkit flow for this
import { generateActionPlanFlow } from "@/ai/flows/generate-action-plan";

// Define Zod schema for the Action Plan JSON
const ActionStepSchema = z.object({
  id: z.string().describe("Identificador único para el paso de acción."),
  description: z.string().describe("Descripción detallada del paso de acción."),
  category: z
    .string()
    .optional()
    .describe(
      "Categoría financiera relacionada (ej. 'Gastos Restaurantes', 'Suscripciones')."
    ),
  estimatedMonthlySavings: z
    .number()
    .optional()
    .describe("Ahorro mensual estimado para este paso."),
  targetDate: z
    .string()
    .optional()
    .describe("Fecha objetivo para completar este paso (YYYY-MM-DD)."),
  status: z
    .enum(["pending", "in-progress", "completed"])
    .default("pending")
    .describe("Estado actual del paso."),
  notes: z.string().optional().describe("Notas adicionales para este paso."),
});
export type ActionStep = z.infer<typeof ActionStepSchema>;

const SavingsGoalSchema = z.object({
  targetAmount: z.number().optional().describe("Monto objetivo del ahorro."),
  targetDate: z
    .string()
    .optional()
    .describe("Fecha objetivo para alcanzar el ahorro (YYYY-MM-DD)."),
  description: z
    .string()
    .describe("Descripción del objetivo de ahorro principal."),
});
export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

export const ActionPlanSchema = z.object({
  planTitle: z
    .string()
    .default("Mi Plan de Acción Financiero")
    .describe("Título del plan de acción."),
  savingsGoal: SavingsGoalSchema.optional().describe(
    "Objetivo principal de ahorro del plan."
  ),
  actionableSteps: z
    .array(ActionStepSchema)
    .describe("Lista de pasos concretos para alcanzar los objetivos."),
  summaryNotes: z
    .string()
    .optional()
    .describe("Resumen o notas generales sobre el plan."),
  lastUpdated: z
    .string()
    .datetime()
    .describe("Fecha y hora de la última actualización del plan."),
});
export type ActionPlanData = z.infer<typeof ActionPlanSchema>;

interface ActionPlanChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ActionPlan() {
  const userData = useUserStore((state) => state.userData);
  const { toast } = useToast();
  const [messages, setMessages] = useState<ActionPlanChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlanJson, setCurrentPlanJson] = useState<ActionPlanData | null>(
    null
  );
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, content, timestamp: new Date() },
    ]);
  };

  // Effect to generate initial plan proposal when userData is available
  useEffect(() => {
    if (userData && messages.length === 0 && !isLoading) {
      // Prevent multiple initial calls if userData updates slightly without a real change relevant to plan
      if (currentPlanJson === null) {
        // console.log("ActionPlan: userData available, generating initial proposal.");
        // generateInitialPlan();
        // Placeholder until Genkit flow is ready
        addMessage(
          "assistant",
          "Hola! Basándome en tus objetivos y finanzas, estoy preparando una propuesta de plan de acción para ti..."
        );
        // Simulate AI thinking and then providing a mock plan
        setIsLoading(true);
        setTimeout(() => {
          const mockInitialPlan: ActionPlanData = {
            planTitle: "Propuesta Inicial de Plan de Ahorro",
            savingsGoal: {
              description:
                userData.specificObjectives?.join(", ") ||
                userData.generalObjectives?.join(", ") ||
                "Mejorar situación financiera",
              targetAmount: 1000, // Example
              targetDate: new Date(
                new Date().setFullYear(new Date().getFullYear() + 1)
              )
                .toISOString()
                .split("T")[0], // One year from now
            },
            actionableSteps: [
              {
                id: crypto.randomUUID(),
                description:
                  "Analizar gastos recurrentes y reducir uno innecesario.",
                estimatedMonthlySavings: 20,
                status: "pending",
              },
              {
                id: crypto.randomUUID(),
                description:
                  "Establecer una transferencia automática mensual a una cuenta de ahorros.",
                estimatedMonthlySavings: 50,
                status: "pending",
              },
            ],
            summaryNotes:
              "Este es un borrador inicial. Podemos ajustarlo juntos.",
            lastUpdated: new Date().toISOString(),
          };
          setCurrentPlanJson(mockInitialPlan);
          addMessage(
            "assistant",
            `Aquí tienes una propuesta inicial:\n\n**${mockInitialPlan.planTitle}**\n- **Objetivo Principal:** ${mockInitialPlan.savingsGoal?.description}\n- **Pasos Sugeridos:**\n  1. ${mockInitialPlan.actionableSteps[0]?.description} (Ahorro estimado: ${mockInitialPlan.actionableSteps[0]?.estimatedMonthlySavings}€)\n  2. ${mockInitialPlan.actionableSteps[1]?.description} (Ahorro estimado: ${mockInitialPlan.actionableSteps[1]?.estimatedMonthlySavings}€)\n\n¿Qué te parece? ¿Quieres modificar algo o añadir más detalles?`
          );
          setIsLoading(false);
        }, 2500);
      }
    }
  }, [userData, messages.length, isLoading, currentPlanJson]);

  const generateInitialPlan = async () => {
    if (!userData) return;
    setIsLoading(true);
    addMessage(
      "assistant",
      "Analizando tus datos para crear una propuesta de plan de acción..."
    );
    try {
      // const response = await generateActionPlan({ userData, currentPlanJSON: null, userQuery: "Generar plan inicial" });
      // setCurrentPlanJson(response.updatedActionPlanJSON);
      // addMessage('assistant', response.chatResponseText);
      // This is a placeholder
      throw new Error("generateActionPlan flow not implemented yet.");
    } catch (error) {
      console.error("Error generating initial plan:", error);
      addMessage(
        "assistant",
        "Lo siento, tuve un problema al generar la propuesta inicial. Por favor, inténtalo de nuevo más tarde."
      );
      toast({
        title: "Error",
        description: "No se pudo generar el plan inicial.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const messageContent = inputValue.trim();
    if (!messageContent || isLoading || !userData) return;

    addMessage("user", messageContent);
    setInputValue("");
    setIsLoading(true);

    try {
      // const response = await generateActionPlanFlow({
      //   userData,
      //   currentPlanJSON: currentPlanJson as any,
      //   userQuery: messageContent
      // });
      // // setCurrentPlanJson(response.updatedActionPlanJSON);
      // addMessage('assistant', response.chatResponseText);
      // Placeholder until Genkit flow is ready
      // setTimeout(() => {
      //   addMessage(
      //     "assistant",
      //     `Entendido. He registrado tu comentario: "${messageContent}". Estoy actualizando el plan... (Simulación)`
      //   );
      //   // Simulate plan update
      //   if (currentPlanJson) {
      //     const updatedPlan = {
      //       ...currentPlanJson,
      //       actionableSteps: [
      //         ...currentPlanJson.actionableSteps,
      //         {
      //           id: crypto.randomUUID(),
      //           description: `Nuevo paso basado en: "${messageContent.substring(
      //             0,
      //             30
      //           )}..."`,
      //           estimatedMonthlySavings: 15,
      //           status: "pending" as const,
      //         },
      //       ],
      //       lastUpdated: new Date().toISOString(),
      //     };
      //     setCurrentPlanJson(updatedPlan);
      //     addMessage(
      //       "assistant",
      //       `He añadido un nuevo paso a tu plan. Ahora tienes ${updatedPlan.actionableSteps.length} pasos. ¿Algo más?`
      //     );
      //   }
      //   setIsLoading(false);
      // }, 1500);
    } catch (error) {
      console.error("Error in ActionPlan chat:", error);
      addMessage(
        "assistant",
        "Lo siento, no pude procesar tu solicitud en este momento."
      );
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan.",
        variant: "destructive",
      });
    } finally {
      // setIsLoading(false); // Moved into setTimeout for simulation
    }
  };

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleExportJson = () => {
    if (!currentPlanJson) {
      toast({
        title: "Sin Plan",
        description: "Aún no se ha generado un plan para exportar.",
        variant: "destructive",
      });
      return;
    }
    const jsonString = JSON.stringify(currentPlanJson, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "action-plan.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Plan Exportado",
      description: "El plan de acción se ha descargado como JSON.",
    });
  };

  return (
    <Card className="h-full flex flex-col border-none bg-transparent col-span-1 row-span-2">
      {" "}
      {/* Ensure it spans correctly */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleExportJson}
          disabled={!currentPlanJson || isLoading}
        >
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
        </Button>
      </div>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea
          className="h-full"
          ref={scrollAreaRef}
          viewportRef={viewportRef}
        >
          <div className="p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ChatAvatar role="assistant" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  <p
                    className={`mt-1 text-xs ${
                      msg.role === "user"
                        ? "text-primary-foreground/70 text-right"
                        : "text-muted-foreground/80 text-left"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            {isLoading &&
              messages.length > 0 && ( // Show typing indicator only if there are prior messages
                <div className="flex items-end gap-2 justify-start">
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ChatAvatar role="assistant" />
                  </div>
                  <div className="max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm bg-muted text-foreground rounded-bl-none">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">
                        hormiwita está pensando
                      </span>
                      <Loader2
                        size={14}
                        className="animate-spin text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 w-full"
        >
          <Input
            type="text"
            placeholder={
              isLoading
                ? "Esperando respuesta..."
                : "Describe cómo quieres ajustar tu plan..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || !userData}
            className="flex-1 text-sm"
            aria-label="Mensaje para el plan de acción"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !inputValue.trim() || !userData}
            aria-label="Enviar mensaje"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <SendHorizontal size={20} />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
