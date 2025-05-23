'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
// Assuming UserData is correctly typed and exported from your store.
// For Genkit flows, it's often better to define explicit input schemas
// or ensure the imported type is fully compatible and understood by the LLM.
// For this example, we'll use z.custom<UserData>() and rely on the prompt
// to guide the LLM on how to interpret it from the provided JSON structure.
import type { UserData, EnhancedExpenseIncomeSummary, BankStatementSummary, CategorizedItem, ProviderTransactionSummary } from '@/store/userStore';

// --- Schemas for Action Plan (already defined, ensure they are robust) ---
const ActionStepSchema = z.object({
  id: z.string().uuid().describe("Identificador único UUID para el paso de acción."),
  description: z.string().min(10).describe("Descripción detallada y específica del paso de acción."),
  category: z.string().optional().describe("Categoría financiera relacionada (ej. 'Gastos Restaurantes', 'Suscripciones', 'Ahorro Deudas')."),
  estimatedMonthlySavings: z.number().optional().describe("Ahorro mensual estimado para este paso, si aplica (número positivo)."),
  targetAmount: z.number().optional().describe("Monto objetivo para este paso específico, si aplica (ej. ahorrar X para una compra)."),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Fecha objetivo para completar este paso (YYYY-MM-DD)."),
  priority: z.enum(["alta", "media", "baja"]).default("media").optional().describe("Prioridad del paso."),
  status: z.enum(["pendiente", "en-progreso", "completado", "cancelado"]).default("pendiente").describe("Estado actual del paso."),
  notes: z.string().optional().describe("Notas adicionales o comentarios para este paso."),
});
export type ActionStep = z.infer<typeof ActionStepSchema>;

const SavingsGoalSchema = z.object({
  targetAmount: z.number().positive().optional().describe("Monto objetivo del ahorro principal (debe ser positivo)."),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Fecha objetivo para alcanzar el ahorro principal (YYYY-MM-DD)."),
  description: z.string().min(5).describe("Descripción clara del objetivo de ahorro principal del plan."),
  currentProgressAmount: z.number().optional().default(0).describe("Progreso actual hacia el monto objetivo."),
});
export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

export const ActionPlanSchema = z.object({
  planTitle: z.string().min(5).default("Mi Plan de Acción Financiero").describe("Título del plan de acción."),
  savingsGoal: SavingsGoalSchema.optional().describe("Objetivo principal de ahorro del plan."),
  actionableSteps: z.array(ActionStepSchema).min(1).describe("Lista de al menos un paso concreto y medible para alcanzar los objetivos."),
  reviewFrequency: z.enum(["semanal", "quincenal", "mensual", "trimestral"]).default("mensual").optional().describe("Frecuencia recomendada para revisar y ajustar el plan."),
  summaryNotes: z.string().optional().describe("Resumen general, motivación o notas clave sobre el plan."),
  lastUpdated: z.string().datetime().describe("Fecha y hora de la última actualización del plan (ISO 8601)."),
  version: z.number().int().positive().default(1).describe("Número de versión del plan, se incrementa con cada modificación significativa."),
});
export type ActionPlanData = z.infer<typeof ActionPlanSchema>;

// --- Schemas for Genkit Flow Input/Output ---
const ActionPlanChatMessageHistorySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const GenerateActionPlanInputSchema = z.object({
  userData: z.custom<UserData>().describe('Objeto JSON con los datos del usuario: name, generalObjectives, specificObjectives, expensesIncomeSummary (que contiene originalSummary con totalIncome, totalExpenses, detectedCurrency, y categorizedExpenseItems/categorizedIncomeItems con suggestedCategory y totalAmount).'),
  currentPlanJSON: ActionPlanSchema.nullable().optional().describe('El plan de acción JSON actual (objeto ActionPlanData), si existe, para iterar sobre él. Nulo si es la primera generación.'),
  userQuery: z.string().describe('La consulta o instrucción actual del usuario para generar o modificar el plan. Si es la primera vez, puede ser algo como "Genera mi plan de ahorro inicial".'),
  chatHistory: z.array(ActionPlanChatMessageHistorySchema).optional().describe('Historial reciente de la conversación específica sobre el plan de acción.'),
});
export type GenerateActionPlanInput = z.infer<typeof GenerateActionPlanInputSchema>;

export const GenerateActionPlanOutputSchema = z.object({
  chatResponseText: z.string().describe('Respuesta conversacional de la IA para el usuario.'),
  updatedActionPlanJSON: ActionPlanSchema.nullable().describe('El plan de acción JSON actualizado. Debe cumplir con ActionPlanSchema. Puede ser nulo si la IA no pudo generar/actualizar un plan válido.'),
  isPlanFinalized: z.boolean().default(false).describe('Indica si la IA considera que el plan está listo o si se esperan más iteraciones.'),
});
export type GenerateActionPlanOutput = z.infer<typeof GenerateActionPlanOutputSchema>;

// --- Genkit Prompt Definition ---
const actionPlanPromptText = `
Eres hormiwita, un asesor financiero IA experto en crear planes de acción personalizados y realistas. Tu objetivo es ayudar al usuario a definir un plan financiero basado en sus datos y objetivos, y luego iterar sobre ese plan según sus indicaciones.

**Contexto del Usuario (Proporcionado en el input 'userData'):**
- Nombre: {{userData.name}}
- Objetivos Generales: {{#if userData.generalObjectives}} {{#each userData.generalObjectives}}* {{this}} {{/each}} {{else}}No definidos.{{/if}}
- Objetivos Específicos: {{#if userData.specificObjectives}} {{#each userData.specificObjectives}}* {{this}} {{/each}} {{else}}No definidos.{{/if}}
- Resumen Financiero (aproximado):
  - Moneda: {{#if userData.expensesIncomeSummary.originalSummary.detectedCurrency}}{{userData.expensesIncomeSummary.originalSummary.detectedCurrency}}{{else}}No especificada{{/if}}
  - Ingresos Totales: {{#if userData.expensesIncomeSummary.originalSummary.totalIncome}}{{userData.expensesIncomeSummary.originalSummary.totalIncome}}{{else}}0{{/if}}
  - Gastos Totales: {{#if userData.expensesIncomeSummary.originalSummary.totalExpenses}}{{userData.expensesIncomeSummary.originalSummary.totalExpenses}}{{else}}0{{/if}}
  - Balance (Ingresos - Gastos): {{(Number(userData.expensesIncomeSummary.originalSummary.totalIncome) || 0) - (Number(userData.expensesIncomeSummary.originalSummary.totalExpenses) || 0)}}
  - Principales Categorías de Gastos (si disponibles):
    {{#if userData.expensesIncomeSummary.categorizedExpenseItems}}
      {{#each userData.expensesIncomeSummary.categorizedExpenseItems}}
        * {{suggestedCategory}}: {{totalAmount}}
      {{/each}}
    {{else}}
      No hay desglose de gastos por categoría disponible.
    {{/if}}

**Plan de Acción Actual (Proporcionado en 'currentPlanJSON', será null si es la primera vez):**
{{#if currentPlanJSON}}
  \`\`\`json
  {{{JSON.stringify currentPlanJSON}}}
  \`\`\`
{{else}}
  No hay un plan previo. Estás creando la propuesta inicial.
{{/if}}

**Historial de esta Conversación sobre el Plan (Proporcionado en 'chatHistory'):**
{{#if chatHistory}}
  {{#each chatHistory}}
    {{role}}: {{content}}
  {{/each}}
{{/if}}

**Consulta Actual del Usuario (Proporcionada en 'userQuery'):**
{{userQuery}}

**Tu Tarea (Responde en español):**

1.  **Análisis y Propuesta Inicial (si \`currentPlanJSON\` es nulo):**
    * Analiza \`userData\` (objetivos, balance ingresos/gastos).
    * Si \`userQuery\` es algo como "genera mi plan inicial", crea una propuesta de plan.
    * **\`planTitle\`**: Algo como "Plan de Ahorro para {{userData.name}}" o "Plan Financiero Inicial".
    * **\`savingsGoal\`**:
        * \`description\`: Basado en \`userData.specificObjectives\` o \`userData.generalObjectives\`. Si no hay, un objetivo general como "Mejorar la salud financiera".
        * \`targetAmount\`: Si los objetivos son cuantificables (ej. "Ahorro para Vehículo"), intenta estimar un monto inicial o preguntar. Si no, puede ser opcional.
        * \`targetDate\`: Opcional, o sugiere un plazo (ej. 1 año).
    * **\`actionableSteps\`**: Crea 2-3 pasos iniciales, específicos, medibles, alcanzables, relevantes y con tiempo (SMART).
        * Ejemplos: "Reducir gastos en 'Comida a Domicilio' en 50 EUR al mes", "Aportar 100 EUR mensuales a un fondo de emergencia", "Revisar suscripciones y cancelar una innecesaria".
        * Cada paso debe tener un \`id\` (genera un UUID válido para cada nuevo paso), \`description\`, y opcionalmente \`category\`, \`estimatedMonthlySavings\`.
    * **\`reviewFrequency\`**: Sugiere "mensual" por defecto.
    * **\`summaryNotes\`**: Breve nota introductoria.
    * **\`lastUpdated\`**: Fecha y hora actual en formato ISO 8601.
    * **\`version\`**: 1.
    * **\`chatResponseText\`**: Explica la propuesta inicial de forma amigable.

2.  **Refinamiento del Plan (si \`currentPlanJSON\` existe):**
    * Analiza el \`userQuery\` para entender qué quiere modificar el usuario (añadir paso, cambiar monto, marcar como completado, etc.).
    * Actualiza el \`currentPlanJSON\` para crear el \`updatedActionPlanJSON\`.
        * Si se añade un paso, asegúrate de que tenga un \`id\` UUID nuevo y único.
        * Actualiza \`lastUpdated\` a la fecha y hora actual.
        * Incrementa \`version\` si hay cambios significativos.
    * **\`chatResponseText\`**: Confirma los cambios realizados o pide aclaraciones.

3.  **Reglas Generales para \`updatedActionPlanJSON\`:**
    * **Siempre** debe cumplir con el \`ActionPlanSchema\` proporcionado.
    * Los \`id\` de los \`actionableSteps\` deben ser UUIDs válidos y únicos dentro del plan.
    * \`estimatedMonthlySavings\` y \`targetAmount\` deben ser números positivos si se proveen.
    * Las fechas deben estar en formato YYYY-MM-DD.

4.  **Respuesta Conversacional (\`chatResponseText\`):**
    * Debe ser clara, concisa y en español.
    * Si la IA no entiende la petición o no puede realizarla, debe explicarlo amablemente y pedir más detalles.
    * Evita jerga financiera compleja a menos que el usuario la utilice.

5.  **\`isPlanFinalized\`**:
    * Por ahora, puedes dejarlo en \`false\` a menos que el usuario explícitamente diga "el plan está completo y finalizado" o algo muy similar.

**IMPORTANTE SOBRE EL JSON DE SALIDA:**
Tu respuesta completa DEBE ser un ÚNICO objeto JSON que se ajuste estrictamente al esquema \`GenerateActionPlanOutputSchema\`. No incluyas texto explicativo fuera de este JSON. El campo \`updatedActionPlanJSON\` debe ser el objeto del plan completo, o \`null\` si no se pudo generar/actualizar.

Ejemplo de un \`actionableSteps\` dentro de \`updatedActionPlanJSON\`:
\`\`\`json
{
  "id": "123e4567-e89b-12d3-a456-426614174000", // Ejemplo de UUID
  "description": "Reducir el gasto en cenas fuera a la mitad durante los próximos 3 meses.",
  "category": "Restaurantes y Ocio",
  "estimatedMonthlySavings": 75,
  "targetDate": "2025-08-31",
  "priority": "alta",
  "status": "pendiente",
  "notes": "Revisar extractos bancarios para identificar cuánto se gasta actualmente."
}
\`\`\`
`;

const actionPlanGenerationPrompt = ai.definePrompt(
  {
    name: 'actionPlanGenerationPrompt',
    system: actionPlanPromptText,
    input: { schema: GenerateActionPlanInputSchema }, // Define input schema for the prompt
    output: { schema: GenerateActionPlanOutputSchema }, // Define output schema for the prompt
    // Tools podrían ser útiles aquí en el futuro para funciones específicas como "calcular balance" o "sugerir categorías"
    // tools: [], 
  }
  // No async prompt function is needed here as 'system' contains the full template
);


export const generateActionPlanFlow = ai.defineFlow(
  {
    name: 'generateActionPlanFlow',
    inputSchema: GenerateActionPlanInputSchema,
    outputSchema: GenerateActionPlanOutputSchema,
  },
  async (input) => {
    console.log("generateActionPlanFlow called with input:", JSON.stringify(input, null, 2));

    const generateStepId = () => crypto.randomUUID(); // Use crypto.randomUUID() for proper UUIDs

    try {
      const llmResponse = await actionPlanGenerationPrompt(input); // Llamada al LLM
      
      let output = llmResponse.output;

      if (!output) {
        console.error('LLM returned no output for action plan generation.');
        return {
          chatResponseText: 'Lo siento, no pude generar una respuesta para el plan de acción en este momento.',
          updatedActionPlanJSON: input.currentPlanJSON || null,
          isPlanFinalized: false,
        };
      }

      if (output.updatedActionPlanJSON) {
        // Ensure actionableSteps is an array, even if AI returns null/undefined mistakenly
        output.updatedActionPlanJSON.actionableSteps = output.updatedActionPlanJSON.actionableSteps || [];
        
        output.updatedActionPlanJSON.actionableSteps = output.updatedActionPlanJSON.actionableSteps.map(step => ({
          ...step,
          id: step.id && z.string().uuid().safeParse(step.id).success ? step.id : generateStepId(),
          priority: step.priority || "media",
          status: step.status || "pendiente",
        }));
        
        // Ensure lastUpdated and version are set if a plan is returned
        output.updatedActionPlanJSON.lastUpdated = new Date().toISOString();
        if (input.currentPlanJSON && JSON.stringify(output.updatedActionPlanJSON) !== JSON.stringify(input.currentPlanJSON)) {
             output.updatedActionPlanJSON.version = (input.currentPlanJSON.version || 0) + 1;
        } else if (!input.currentPlanJSON) {
            output.updatedActionPlanJSON.version = 1;
        }


        try {
            ActionPlanSchema.parse(output.updatedActionPlanJSON);
        } catch (zodError) {
            console.error("Zod validation failed for AI generated plan:", zodError);
            return {
                chatResponseText: `Hubo un problema con el formato del plan generado por la IA. Por favor, intenta describir tu solicitud de otra manera. (Detalles: ${ (zodError as z.ZodError).errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') })`,
                updatedActionPlanJSON: input.currentPlanJSON || null,
                isPlanFinalized: false,
            };
        }
      } else if (input.userQuery.toLowerCase().includes("inicial") && !input.currentPlanJSON) {
         console.warn('LLM returned null for initial plan generation.');
         output.chatResponseText = output.chatResponseText || 'No pude generar una propuesta inicial en este momento, pero ¿podrías decirme más sobre lo que te gustaría lograr?';
      }

      console.log("generateActionPlanFlow returning output:", JSON.stringify(output, null, 2));
      return output;

    } catch (error) {
      console.error('Error in generateActionPlanFlow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        chatResponseText: `Lo siento, ocurrió un error al procesar tu solicitud para el plan de acción: ${errorMessage}`,
        updatedActionPlanJSON: input.currentPlanJSON || null,
        isPlanFinalized: false,
      };
    }
  }
);

// Es importante registrar este flujo en tu archivo src/ai/dev.ts para que Genkit UI lo reconozca
// Ejemplo en dev.ts:
// import '@/ai/flows/generateActionPlan';
