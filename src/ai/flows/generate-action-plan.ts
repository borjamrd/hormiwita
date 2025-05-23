import { z } from 'genkit';
import type { UserData } from '@/store/userStore'; // Assuming UserData is exported from your store

// --- Schemas for Action Plan ---
const ActionStepSchema = z.object({
  id: z.string().describe("Identificador único para el paso de acción."),
  description: z.string().describe("Descripción detallada del paso de acción."),
  category: z.string().optional().describe("Categoría financiera relacionada (ej. 'Gastos Restaurantes', 'Suscripciones')."),
  estimatedMonthlySavings: z.number().optional().describe("Ahorro mensual estimado para este paso, si aplica (número positivo)."),
  targetAmount: z.number().optional().describe("Monto objetivo para este paso específico, si aplica (ej. ahorrar X para una compra)."),
  targetDate: z.string().optional().describe("Fecha objetivo para completar este paso (YYYY-MM-DD)."),
  priority: z.enum(["alta", "media", "baja"]).optional().describe("Prioridad del paso."),
  status: z.enum(["pendiente", "en-progreso", "completado", "cancelado"]).default("pendiente").describe("Estado actual del paso."),
  notes: z.string().optional().describe("Notas adicionales o comentarios para este paso."),
});
export type ActionStep = z.infer<typeof ActionStepSchema>;

const SavingsGoalSchema = z.object({
  targetAmount: z.number().optional().describe("Monto objetivo del ahorro principal."),
  targetDate: z.string().optional().describe("Fecha objetivo para alcanzar el ahorro principal (YYYY-MM-DD)."),
  description: z.string().describe("Descripción del objetivo de ahorro principal del plan."),
  currentProgressAmount: z.number().optional().describe("Progreso actual hacia el monto objetivo."),
});
export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

export const ActionPlanSchema = z.object({
  planTitle: z.string().default("Mi Plan de Acción Financiero").describe("Título del plan de acción."),
  savingsGoal: SavingsGoalSchema.optional().describe("Objetivo principal de ahorro del plan."),
  actionableSteps: z.array(ActionStepSchema).describe("Lista de pasos concretos y medibles para alcanzar los objetivos."),
  reviewFrequency: z.enum(["semanal", "quincenal", "mensual", "trimestral"]).optional().describe("Frecuencia recomendada para revisar y ajustar el plan."),
  summaryNotes: z.string().optional().describe("Resumen general, motivación o notas clave sobre el plan."),
  lastUpdated: z.string().datetime().describe("Fecha y hora de la última actualización del plan (ISO 8601)."),
  version: z.number().default(1).describe("Número de versión del plan, se incrementa con cada modificación significativa."),
});
export type ActionPlanData = z.infer<typeof ActionPlanSchema>;

// --- Schemas for Genkit Flow Input/Output ---

// Define schema for individual chat messages in history for this specific flow
const ActionPlanChatMessageHistorySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// We need to define UserData schema here again or ensure it can be imported if it's complex.
// For simplicity, if UserData from store is simple enough, we can use it directly.
// However, Genkit flows typically redefine their input schemas for clarity and decoupling.
// Let's assume UserData from '@/store/userStore' is correctly typed and can be used.

export const GenerateActionPlanInputSchema = z.object({
  userData: z.custom<UserData>().describe('Datos completos del usuario (nombre, objetivos, resumen financiero).'),
  currentPlanJSON: ActionPlanSchema.nullable().optional().describe('El plan de acción JSON actual, si existe, para iterar sobre él. Nulo si es la primera generación.'),
  userQuery: z.string().describe('La consulta o instrucción actual del usuario para generar o modificar el plan.'),
  chatHistory: z.array(ActionPlanChatMessageHistorySchema).optional().describe('Historial reciente de la conversación específica del plan de acción.'),
});
export type GenerateActionPlanInput = z.infer<typeof GenerateActionPlanInputSchema>;

export const GenerateActionPlanOutputSchema = z.object({
  chatResponseText: z.string().describe('Respuesta conversacional de la IA para el usuario.'),
  updatedActionPlanJSON: ActionPlanSchema.nullable().describe('El plan de acción JSON actualizado. Puede ser nulo si la IA no pudo generar/actualizar un plan válido.'),
  isPlanFinalized: z.boolean().default(false).describe('Indica si la IA considera que el plan está listo o si se esperan más iteraciones.'),
});
export type GenerateActionPlanOutput = z.infer<typeof GenerateActionPlanOutputSchema>;

// Placeholder for the actual Genkit flow implementation
import { ai } from '@/ai/genkit'; // Assuming genkit is configured
export const generateActionPlanFlow = ai.defineFlow(
  {
    name: 'generateActionPlanFlow',
    inputSchema: GenerateActionPlanInputSchema,
    outputSchema: GenerateActionPlanOutputSchema,
  },
  async (input) => {
    // AI logic to process input and generate/update plan
    // This will involve a detailed prompt
    console.log("generateActionPlanFlow called with:", input);
    // Mock response for now
    return {
      chatResponseText: `He procesado tu solicitud: "${input.userQuery}". Aquí está el plan actualizado (simulado).`,
      updatedActionPlanJSON: input.currentPlanJSON || { 
        planTitle: "Plan Simulado", 
        actionableSteps: [], 
        lastUpdated: new Date().toISOString(),
        version: (input.currentPlanJSON || 0) + 1,
      },
      isPlanFinalized: false,
    };
  }
);
