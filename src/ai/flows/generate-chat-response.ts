
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating helpful chatbot responses related to personal finance and banking.
 * It also extracts user information like name, general financial objectives, specific financial objectives, and expense/income summary.
 *
 * - generateChatResponse - A function that takes user query, chat history, and existing user data,
 *   and returns a chatbot response and potentially updated user data.
 * - GenerateChatResponseInput - The input type for the generateChatResponse function.
 * - GenerateChatResponseOutput - The return type for the generateChatResponse function.
 * - UserData - Type for user's collected information.
 * - EnhancedExpenseIncomeSummary - Type for the detailed expense/income summary including categorized items.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Define Schemas locally as they cannot be reliably imported from other 'use server' files for Zod object usage ---

// Schema for individual provider transaction summary (mirroring definition in analyze-bank-statements.ts)
const ProviderTransactionSummarySchema = z.object({
  providerName: z.string().describe("Nombre normalizado del proveedor, comercio, pagador o beneficiario."),
  totalAmount: z.number().describe("Monto total para este proveedor. Siempre un número positivo. La categoría (ingreso/gasto) define su naturaleza."),
  transactionCount: z.number().int().describe("Número de transacciones con este proveedor."),
});

// Schema for a single categorized item (mirroring definition in categorize-financial-data.ts)
const CategorizedItemSchema = ProviderTransactionSummarySchema.extend({
  suggestedCategory: z.string().describe("Categoría financiera sugerida para este proveedor/concepto."),
});

// Schema for the raw bank statement analysis summary (mirroring definition in analyze-bank-statements.ts)
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified", "Unsupported File Type"])
    .describe("Status of the analysis based on the provided file."),
  feedback: z.string().describe("A brief textual summary or feedback on the analysis."),
  incomeByProvider: z.array(ProviderTransactionSummarySchema).optional()
    .describe("Lista de fuentes de ingresos, agrupadas por proveedor/pagador."),
  expensesByProvider: z.array(ProviderTransactionSummarySchema).optional()
    .describe("Lista de gastos, agrupados por proveedor/comercio."),
  totalIncome: z.number().optional().describe("Ingreso total numérico identificado en el extracto."),
  totalExpenses: z.number().optional().describe("Gasto total numérico identificado en el extracto (representado como un número positivo)."),
  detectedCurrency: z.string().optional().describe("Código de moneda principal detectado en el extracto (ej. EUR, USD, GBP)."),
  unassignedTransactions: z.number().int().optional().describe("Número de transacciones que no pudieron ser claramente asignadas a ingresos o gastos, o a un proveedor específico."),
});

// New schema for the enhanced summary in UserData, including categorized items
const EnhancedExpenseIncomeSummarySchema = z.object({
  originalSummary: BankStatementSummarySchema.describe("The raw summary from the initial bank statement analysis."),
  categorizedIncomeItems: z.array(CategorizedItemSchema).nullable().optional().describe("List of categorized income items."),
  categorizedExpenseItems: z.array(CategorizedItemSchema).nullable().optional().describe("List of categorized expense items."),
});
export type EnhancedExpenseIncomeSummary = z.infer<typeof EnhancedExpenseIncomeSummarySchema>;


// Define schema for individual chat messages in history
const ChatMessageHistorySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// Define schema for user data
const UserDataSchema = z.object({
  name: z.string().optional().describe("The user's name."),
  generalObjectives: z.array(z.string()).optional().describe("A list of the user's general financial objectives."),
  specificObjectives: z.array(z.string()).optional().describe("A list of the user's specific financial objectives, related to their general ones."),
  expensesIncomeSummary: EnhancedExpenseIncomeSummarySchema.optional().describe("Summary of user's expenses and income from uploaded statements, including original analysis and categorized items."),
});
export type UserData = z.infer<typeof UserDataSchema>;

// Define input schema for the main flow
const GenerateChatResponseInputSchema = z.object({
  query: z.string().describe('The current user query.'),
  chatHistory: z.array(ChatMessageHistorySchema).optional().describe('The recent history of the conversation.'),
  userData: UserDataSchema.optional().describe('Data already known about the user.'),
});
export type GenerateChatResponseInput = z.infer<typeof GenerateChatResponseInputSchema>;

// Define output schema for the main flow
const GenerateChatResponseOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
  updatedUserData: UserDataSchema.optional().describe('Updated user data after processing the query, including any newly extracted information.'),
  nextExpectedInput: z.enum([
      "name", 
      "general_objectives_selection", 
      "specific_objectives_selection", 
      "expense_income_upload",
      "summary_display", 
      "general_conversation"
    ]).optional().describe("Hint for the frontend on what kind of input is expected next.")
});
export type GenerateChatResponseOutput = z.infer<typeof GenerateChatResponseOutputSchema>;

// Schema for the direct output from the LLM prompt
const PromptOutputSchema = z.object({
  textResponse: z.string().describe('The chatbot response to the user query.'),
  extractedName: z.string().nullable().optional().describe("The user's name, if extracted in the current turn based on user input and extractNameTool guidance."),
  extractedGeneralObjectives: z.array(z.string()).nullable().optional().describe("General financial objectives, if extracted in the current turn based on user input and extractGeneralObjectivesTool guidance."),
  extractedSpecificObjectives: z.array(z.string()).nullable().optional().describe("Specific financial objectives, if extracted in the current turn based on user input and extractSpecificObjectivesTool guidance."),
  nextExpectedInput: z.enum([
      "name", 
      "general_objectives_selection", 
      "specific_objectives_selection", 
      "expense_income_upload", 
      "summary_display", 
      "general_conversation"
    ]).optional().describe("Indicates the type of input the AI is expecting next.")
});


const extractNameTool = ai.defineTool(
  {
    name: 'extractNameTool',
    description: "Extracts the user's name if they provide it. This tool helps understand if the user's message contains their name.",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ name: z.string().optional() }),
  },
  async (input) => ({ name: undefined }) // Conceptual: Actual extraction is done by LLM into PromptOutputSchema.extractedName
);

const extractGeneralObjectivesTool = ai.defineTool(
  {
    name: 'extractGeneralObjectivesTool',
    description: "Extracts general financial objectives if the user states them. This tool helps understand if the user's message contains general objectives.",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ generalObjectives: z.array(z.string()).optional() }),
  },
  async (input) => ({ generalObjectives: undefined }) // Conceptual
);

const extractSpecificObjectivesTool = ai.defineTool(
  {
    name: 'extractSpecificObjectivesTool',
    description: "Extracts specific financial objectives if the user states them. This tool helps understand if the user's message contains specific objectives.",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ specificObjectives: z.array(z.string()).optional() }),
  },
  async (input) => ({ specificObjectives: undefined }) // Conceptual
);

const acknowledgeExpenseIncomeSummaryTool = ai.defineTool(
  {
    name: 'acknowledgeExpenseIncomeSummaryTool',
    description: "This tool is used when the user confirms that their expense/income summary (provided by an external analysis) has been processed and they are communicating this confirmation back to the chatbot. The actual summary data is already present in `userData.expensesIncomeSummary`.",
    inputSchema: z.object({ query: z.string().describe("The user's message confirming the bank statement analysis, which typically includes the feedback from that analysis.") }), 
    outputSchema: z.object({ acknowledged: z.boolean().optional().describe("True if the user's message is a confirmation of the bank statement analysis.") }),
  },
  async (input) => ({ acknowledged: true }) // Conceptual: The LLM uses this tool's description to understand the user's intent.
);


export async function generateChatResponse(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}

const systemPrompt = `Eres hormiwita, un asistente experto en finanzas personales. Tu objetivo principal es ayudar al usuario a organizar sus finanzas. Para ello, necesitas recopilar información en las siguientes categorías y orden: información personal (nombre), objetivos generales, objetivos concretos, relación de gastos e ingresos (a través de la subida de un extracto), y finalmente presentar un resumen para confirmación.

Sigue este orden para recopilar la información y establece el campo \`nextExpectedInput\` en tu respuesta JSON según corresponda:
1.  **Información Personal**: Si aún no conoces el nombre del usuario (\`userData.name\` no presente/vacío), tu primera prioridad es preguntarle su nombre. Establece \`nextExpectedInput: "name"\`. Si el usuario provee su nombre, extráelo en \`extractedName\`. Ejemplo: 'Hola! Encantada de saludarte. Estoy aquí para echarte una mano al organizar tus finanzas. Para comenzar y dirigirnos mejor, ¿podrías decirme tu nombre?'.
2.  **Objetivos Generales**: Con el nombre (\`userData.name\` presente) y sin objetivos generales (\`userData.generalObjectives\` no presente/vacío), pregúntale por ellos. Establece \`nextExpectedInput: "general_objectives_selection"\`. Si los provee, extráelos en \`extractedGeneralObjectives\`. Ejemplo: 'Gracias, {{userData.name}}. Ahora, ¿cuáles son tus principales objetivos financieros generales?'.
3.  **Objetivos Concretos**: Con objetivos generales (\`userData.generalObjectives\` presente/no vacío) y sin objetivos concretos (\`userData.specificObjectives\` no presente/vacío), pregúntale por ellos, relacionados con los generales. Establece \`nextExpectedInput: "specific_objectives_selection"\`. Si los provee, extráelos en \`extractedSpecificObjectives\`. Ejemplo: 'Entendido. Dentro de Ahorro, ¿tienes objetivos más específicos?'.
4.  **Relación de Gastos e Ingresos**: Con nombre, objetivos generales y concretos presentes, y si \`userData.expensesIncomeSummary\` no está presente, es el momento de pedir al usuario que suba sus extractos bancarios. Establece \`nextExpectedInput: "expense_income_upload"\`. Ejemplo: 'Genial. Para entender mejor tu situación actual, por favor, sube un extracto bancario reciente (Excel o CSV). Esto nos ayudará a analizar tus gastos e ingresos.' No intentes analizar el archivo directamente aquí. Solo pide que lo suban. Cuando el usuario envíe un mensaje confirmando el análisis de sus extractos (este mensaje contendrá frases como 'He confirmado el análisis' y mencionará el feedback del análisis, que es procesado por \`acknowledgeExpenseIncomeSummaryTool\`), tu respuesta de texto DEBE acusar recibo de esa confirmación, y OBLIGATORIAMENTE DEBES establecer \`nextExpectedInput: "summary_display"\` en tu respuesta JSON. Tu respuesta de texto podría ser, por ejemplo: 'Entendido, gracias por confirmar el análisis. Antes de continuar, revisemos la información que hemos recopilado.'.
5.  **Confirmación del Resumen**: Este paso es activado por el frontend cuando \`nextExpectedInput\` es \`summary_display\`. El frontend mostrará un resumen de toda la información (\`userData\`). El usuario responderá aceptando ("He aceptado el resumen") o pidiendo modificar (lo que reiniciará el chat). Si el usuario acepta, tu respuesta de texto debe confirmar y pasar a la conversación general. Establece \`nextExpectedInput: "general_conversation"\`.
6.  **Conversación General**: Si ya tienes toda la información confirmada, o si el usuario hace una pregunta general en cualquier momento, responde útilmente. Establece \`nextExpectedInput: "general_conversation"\`.

Instrucciones adicionales:
- Siempre responde en español.
- Mantén las respuestas concisas.
- Evita dar recomendaciones de inversión directas.
- Usa las herramientas conceptuales (\`extractNameTool\`, \`extractGeneralObjectivesTool\`, \`extractSpecificObjectivesTool\`, \`acknowledgeExpenseIncomeSummaryTool\`) para guiar la extracción, pero los datos extraídos deben ir en los campos \`extractedName\`, \`extractedGeneralObjectives\`, \`extractedSpecificObjectives\` de tu respuesta JSON principal. El \`expensesIncomeSummary\` vendrá de \`userData\`.
- Tu respuesta al usuario (\`textResponse\`) siempre debe ser un mensaje de chat directo.
- Revisa \`chatHistory\` y \`userData\` para el contexto. No vuelvas a pedir información que ya tengas a menos que el usuario indique que quiere modificarla.
- Tu salida debe ser un objeto JSON que cumpla con \`PromptOutputSchema\`.`;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  system: systemPrompt,
  tools: [
    extractNameTool, 
    extractGeneralObjectivesTool, 
    extractSpecificObjectivesTool, 
    acknowledgeExpenseIncomeSummaryTool,
  ],
  input: { schema: GenerateChatResponseInputSchema },
  output: { schema: PromptOutputSchema },
  prompt:
    `{{#if chatHistory}}
Historial de chat reciente (assistant es hormiwita, user es el usuario):
{{#each chatHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

Información del usuario ya conocida (userData):
Nombre: {{#if userData.name}}{{userData.name}}{{else}}No proporcionado{{/if}}
Objetivos Generales: {{#if userData.generalObjectives}}{{#each userData.generalObjectives}}- {{this}} {{/each}}{{else}}No proporcionados{{/if}}
Objetivos Concretos: {{#if userData.specificObjectives}}{{#each userData.specificObjectives}}- {{this}} {{/each}}{{else}}No proporcionados{{/if}}
Resumen Gastos/Ingresos: {{#if userData.expensesIncomeSummary}}Analizado (Feedback Original: {{userData.expensesIncomeSummary.originalSummary.feedback}}){{else}}No proporcionado{{/if}}

Mensaje actual del usuario:
user: {{query}}

Respuesta JSON de hormiwita (assistant) cumpliendo con PromptOutputSchema:
`,
});


const generateChatResponseFlow = ai.defineFlow(
  {
    name: 'generateChatResponseFlow',
    inputSchema: GenerateChatResponseInputSchema,
    outputSchema: GenerateChatResponseOutputSchema,
  },
  async (input) => {
    const llmCallResult = await prompt(input);
    const promptOutput = llmCallResult.output;
    
    if (!promptOutput || typeof promptOutput.textResponse !== 'string') {
      console.error("LLM output was missing or malformed. Full result:", JSON.stringify(llmCallResult, null, 2));
       return {
        response: "Lo siento, tuve un problema al procesar mi respuesta. Por favor, intenta de nuevo.",
        updatedUserData: input.userData, 
        nextExpectedInput: "general_conversation", 
      };
    }
        
    const chatResponseText = promptOutput.textResponse;
    let finalNextExpectedInput = promptOutput.nextExpectedInput || "general_conversation";


    let cumulativeName = input.userData?.name;
    let cumulativeGeneralObjectives = input.userData?.generalObjectives || [];
    let cumulativeSpecificObjectives = input.userData?.specificObjectives || [];
    
    if (promptOutput.extractedName) {
      cumulativeName = promptOutput.extractedName;
    }
    if (promptOutput.extractedGeneralObjectives && promptOutput.extractedGeneralObjectives.length > 0) {
      const newGeneral = promptOutput.extractedGeneralObjectives.filter(obj => !cumulativeGeneralObjectives.includes(obj));
      cumulativeGeneralObjectives = [...cumulativeGeneralObjectives, ...newGeneral];
    }
    if (promptOutput.extractedSpecificObjectives && promptOutput.extractedSpecificObjectives.length > 0) {
      const newSpecific = promptOutput.extractedSpecificObjectives.filter(obj => !cumulativeSpecificObjectives.includes(obj));
      cumulativeSpecificObjectives = [...cumulativeSpecificObjectives, ...newSpecific];
    }

    const finalUserData: UserData = {
      name: cumulativeName,
      generalObjectives: cumulativeGeneralObjectives.length > 0 ? cumulativeGeneralObjectives : undefined,
      specificObjectives: cumulativeSpecificObjectives.length > 0 ? cumulativeSpecificObjectives : undefined,
      expensesIncomeSummary: input.userData?.expensesIncomeSummary, 
    };
    
    const nameChanged = finalUserData.name !== input.userData?.name;
    const generalObjectivesChanged = JSON.stringify(finalUserData.generalObjectives) !== JSON.stringify(input.userData?.generalObjectives);
    const specificObjectivesChanged = JSON.stringify(finalUserData.specificObjectives) !== JSON.stringify(input.userData?.specificObjectives);
    
    const isInitialPopulation = !input.userData && 
      (finalUserData.name || 
       finalUserData.generalObjectives?.length || 
       finalUserData.specificObjectives?.length
      );
    
    const shouldIncludeUserData = nameChanged || generalObjectivesChanged || specificObjectivesChanged || isInitialPopulation;

    return {
      response: chatResponseText,
      updatedUserData: shouldIncludeUserData ? finalUserData : input.userData, 
      nextExpectedInput: finalNextExpectedInput,
    };
  }
);


    