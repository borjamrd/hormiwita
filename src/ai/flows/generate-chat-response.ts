
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
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { BankStatementSummary } from './analyze-bank-statements'; // Import the type

// Define schema for individual chat messages in history
const ChatMessageHistorySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// Define BankStatementSummarySchema here as it cannot be exported from 'analyze-bank-statements.ts' ('use server' file)
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified"])
    .describe("Status of the analysis based on the provided file."),
  feedback: z.string().describe("A brief textual summary or feedback on the analysis. This could include total income/expenses if identifiable, or notes on parsing."),
});


// Define schema for user data
const UserDataSchema = z.object({
  name: z.string().optional().describe("The user's name."),
  generalObjectives: z.array(z.string()).optional().describe("A list of the user's general financial objectives."),
  specificObjectives: z.array(z.string()).optional().describe("A list of the user's specific financial objectives, related to their general ones."),
  expensesIncomeSummary: BankStatementSummarySchema.optional().describe("Summary of user's expenses and income from uploaded statements."),
});
export type UserData = z.infer<typeof UserDataSchema>;

// Define input schema for the main flow
const GenerateChatResponseInputSchema = z.object({
  query: z.string().describe('The current user query.'),
  chatHistory: z.array(ChatMessageHistorySchema).optional().describe('The recent history of the conversation.'),
  userData: UserDataSchema.optional().describe('Data already known about the user.'),
});
export type GenerateChatResponseInput = z.infer<typeof GenerateChatResponseInputSchema>;

// Define output schema for the main flow (this remains the contract for the calling function)
const GenerateChatResponseOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
  updatedUserData: UserDataSchema.optional().describe('Updated user data after processing the query, including any newly extracted information.'),
  nextExpectedInput: z.enum(["name", "general_objectives_selection", "specific_objectives_selection", "expense_income_upload", "additional_info_discussion", "general_conversation"]).optional().describe("Hint for the frontend on what kind of input is expected next.")
});
export type GenerateChatResponseOutput = z.infer<typeof GenerateChatResponseOutputSchema>;

// Tool to extract user's name
const extractNameTool = ai.defineTool(
  {
    name: 'extractNameTool',
    description: "A conceptual tool to guide the LLM. If the user provides their name or introduces themselves, the LLM should extract this name.",
    inputSchema: z.object({ query: z.string().describe("The user's message which might contain their name.") }),
    outputSchema: z.object({ name: z.string().optional().describe("The extracted name of the user.") }),
  },
  async (input) => {
    // This tool is conceptual for the LLM's guidance.
    // The actual extraction will be done by the LLM and returned in its main JSON response.
    return { name: undefined };
  }
);

// Tool to extract general financial objectives
const extractGeneralObjectivesTool = ai.defineTool(
  {
    name: 'extractGeneralObjectivesTool',
    description: "A conceptual tool to guide the LLM. If the user discusses their general financial goals or confirms a selection of general objectives, the LLM should extract these objectives.",
    inputSchema: z.object({ query: z.string().describe("The user's message which might contain their general financial objectives.") }),
    outputSchema: z.object({ generalObjectives: z.array(z.string()).optional().describe("A list of extracted general financial objectives.") }),
  },
  async (input) => {
    return { generalObjectives: undefined };
  }
);

// Tool to extract specific financial objectives
const extractSpecificObjectivesTool = ai.defineTool(
  {
    name: 'extractSpecificObjectivesTool',
    description: "A conceptual tool to guide the LLM. If the user discusses or selects specific financial goals related to their previously stated general objectives, the LLM should extract these specific objectives.",
    inputSchema: z.object({
      query: z.string().describe("The user's message which might contain their specific financial objectives."),
    }),
    outputSchema: z.object({ specificObjectives: z.array(z.string()).optional().describe("A list of extracted specific financial objectives.") }),
  },
  async (input) => {
    return { specificObjectives: undefined };
  }
);

// Tool to acknowledge expense/income summary (conceptual for now)
const acknowledgeExpenseIncomeSummaryTool = ai.defineTool(
  {
    name: 'acknowledgeExpenseIncomeSummaryTool',
    description: "A conceptual tool to guide the LLM. If the user confirms they've uploaded their expense/income data and a summary is provided in their message, the LLM should acknowledge receipt and potentially extract key details if the summary is simple enough. For now, primarily acknowledge.",
    inputSchema: z.object({ query: z.string().describe("The user's message confirming upload and potentially containing a summary of expenses/income.") }),
    outputSchema: z.object({ acknowledged: z.boolean().optional().describe("True if the summary was acknowledged.") }),
  },
  async (input) => {
    return { acknowledged: true }; // For LLM guidance
  }
);


// Schema for the direct output from the LLM prompt
const PromptOutputSchema = z.object({
  textResponse: z.string().describe('The chatbot response to the user query.'),
  extractedName: z.string().nullable().optional().describe("The user's name, if extracted in the current turn based on user input and extractNameTool guidance."),
  extractedGeneralObjectives: z.array(z.string()).nullable().optional().describe("General financial objectives, if extracted in the current turn based on user input and extractGeneralObjectivesTool guidance."),
  extractedSpecificObjectives: z.array(z.string()).nullable().optional().describe("Specific financial objectives, if extracted in the current turn based on user input and extractSpecificObjectivesTool guidance."),
  // expensesIncomeSummary is not directly extracted by this prompt, it's passed in userData after separate analysis.
  nextExpectedInput: z.enum(["name", "general_objectives_selection", "specific_objectives_selection", "expense_income_upload", "additional_info_discussion", "general_conversation"]).optional().describe("Indicates the type of input the AI is expecting next.")
});


export async function generateChatResponse(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}

const systemPrompt = `Eres hormiwita, un asistente experto en finanzas personales. Tu objetivo principal es ayudar al usuario a organizar sus finanzas. Para ello, necesitas recopilar información en las siguientes categorías y orden: información personal (nombre), objetivos generales, objetivos concretos, relación de gastos e ingresos (a través de la subida de un extracto), información adicional y, finalmente, generar un resumen.

Sigue este orden para recopilar la información y establece el campo \\\`nextExpectedInput\\\` en tu respuesta JSON según corresponda:
1.  **Información Personal**: Si aún no conoces el nombre del usuario (\\\`userData.name\\\` no presente/vacío), tu primera prioridad es preguntarle su nombre. Establece \\\`nextExpectedInput: "name"\\\`. Si el usuario provee su nombre, extráelo en \\\`extractedName\\\`. Ejemplo: 'Hola! Para comenzar y dirigirnos mejor, ¿podrías decirme tu nombre?'.
2.  **Objetivos Generales**: Con el nombre (\\\`userData.name\\\` presente) y sin objetivos generales (\\\`userData.generalObjectives\\\` no presente/vacío), pregúntale por ellos. Establece \\\`nextExpectedInput: "general_objectives_selection"\\\`. Si los provee, extráelos en \\\`extractedGeneralObjectives\\\`. Ejemplo: 'Gracias, {{userData.name}}. Ahora, ¿cuáles son tus principales objetivos financieros generales?'.
3.  **Objetivos Concretos**: Con objetivos generales (\\\`userData.generalObjectives\\\` presente/no vacío) y sin objetivos concretos (\\\`userData.specificObjectives\\\` no presente/vacío), pregúntale por ellos, relacionados con los generales. Establece \\\`nextExpectedInput: "specific_objectives_selection"\\\`. Si los provee, extráelos en \\\`extractedSpecificObjectives\\\`. Ejemplo: 'Entendido. Dentro de Ahorro, ¿tienes objetivos más específicos?'.
4.  **Relación de Gastos e Ingresos**: Con nombre, objetivos generales y concretos presentes, y si \\\`userData.expensesIncomeSummary\\\` no está presente, es el momento de pedir al usuario que suba sus extractos bancarios. Establece \\\`nextExpectedInput: "expense_income_upload"\\\`. Ejemplo: 'Genial. Para entender mejor tu situación actual, por favor, sube un extracto bancario reciente (Excel o CSV). Esto nos ayudará a analizar tus gastos e ingresos.' No intentes analizar el archivo directamente aquí. Solo pide que lo suban. Una vez que el usuario confirme la subida y envíe un resumen del análisis (realizado por otro sistema), acusa recibo de ese resumen y considera este paso completado.
5.  **Información Adicional**: Si ya tienes nombre, objetivos (generales y concretos) y se ha procesado la relación de gastos e ingresos (\\\`userData.expensesIncomeSummary\\\` está presente), puedes pasar a recopilar información adicional si es necesario para elaborar un plan, o puedes empezar a resumir. Por ahora, después de gastos/ingresos, puedes preguntar algo general. Establece \\\`nextExpectedInput: "additional_info_discussion"\\\` o \\\`"general_conversation"\\\`. Ejemplo: 'Gracias por la información de tus extractos. ¿Hay algo más que consideres importante sobre tu situación financiera que deba saber?'
6.  **Conversación General**: Si ya tienes toda la información o si el usuario hace una pregunta general, responde útilmente. Establece \\\`nextExpectedInput: "general_conversation"\\\`.

Instrucciones adicionales:
- Siempre responde en español.
- Mantén las respuestas por debajo de 200 palabras.
- Evita dar recomendaciones de inversión directas.
- Usa las herramientas \\\`extractNameTool\\\`, \\\`extractGeneralObjectivesTool\\\`, \\\`extractSpecificObjectivesTool\\\`, y \\\`acknowledgeExpenseIncomeSummaryTool\\\` como guía conceptual para la extracción/reconocimiento, pero los datos extraídos deben ir en los campos \\\`extractedName\\\`, \\\`extractedGeneralObjectives\\\`, \\\`extractedSpecificObjectives\\\` de tu respuesta JSON. El \\\`expensesIncomeSummary\\\` vendrá de \\\`userData\\\`.
- Tu respuesta al usuario (\\\`textResponse\\\`) siempre debe ser un mensaje de chat directo.
- Revisa \\\`chatHistory\\\` y \\\`userData\\\` para el contexto.
- Tu salida debe ser un objeto JSON que cumpla con \\\`PromptOutputSchema\\\`.`;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  system: systemPrompt,
  tools: [extractNameTool, extractGeneralObjectivesTool, extractSpecificObjectivesTool, acknowledgeExpenseIncomeSummaryTool],
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
Resumen Gastos/Ingresos: {{#if userData.expensesIncomeSummary}}Analizado: {{userData.expensesIncomeSummary.status}} - {{userData.expensesIncomeSummary.feedback}}{{else}}No proporcionado{{/if}}

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
      console.error("LLM output was missing or malformed. Full result:", llmCallResult);
      // Even if textResponse is missing, we might have extracted data or nextExpectedInput
    }
    
    const chatResponseText = promptOutput?.textResponse || "No se pudo generar una respuesta de texto.";
    const nextExpectedInput = promptOutput?.nextExpectedInput || "general_conversation";

    let cumulativeName = input.userData?.name;
    let cumulativeGeneralObjectives = input.userData?.generalObjectives || [];
    let cumulativeSpecificObjectives = input.userData?.specificObjectives || [];
    // expensesIncomeSummary is handled differently, it's updated when the user confirms the analysis from UploadRecords
    let cumulativeExpensesIncomeSummary = input.userData?.expensesIncomeSummary;

    if (promptOutput?.extractedName) {
      cumulativeName = promptOutput.extractedName;
    }
    if (promptOutput?.extractedGeneralObjectives && promptOutput.extractedGeneralObjectives.length > 0) {
      cumulativeGeneralObjectives = Array.from(new Set([...cumulativeGeneralObjectives, ...promptOutput.extractedGeneralObjectives]));
    }
    if (promptOutput?.extractedSpecificObjectives && promptOutput.extractedSpecificObjectives.length > 0) {
      cumulativeSpecificObjectives = Array.from(new Set([...cumulativeSpecificObjectives, ...promptOutput.extractedSpecificObjectives]));
    }

    // Special handling for when user submits expense summary
    // The user's message might be "He analizado mis extractos. El feedback del análisis es: [summary.feedback]"
    // And `input.userData.expensesIncomeSummary` would have been updated by ChatPage prior to this call.
    // Here, we just ensure we are using the latest userData which ChatPage would have updated.
    // The LLM's role here is mostly to acknowledge and move to the next step.

    const finalUserData: UserData = {
      name: cumulativeName,
      generalObjectives: cumulativeGeneralObjectives.length > 0 ? cumulativeGeneralObjectives : undefined,
      specificObjectives: cumulativeSpecificObjectives.length > 0 ? cumulativeSpecificObjectives : undefined,
      expensesIncomeSummary: cumulativeExpensesIncomeSummary, // This comes from input.userData, updated by ChatPage
    };
    
    // Determine if userData should be included in the response
    const nameChanged = finalUserData.name !== input.userData?.name;
    const generalObjectivesChanged = (() => {
        const finalSet = new Set(finalUserData.generalObjectives || []);
        const inputSet = new Set(input.userData?.generalObjectives || []);
        return finalSet.size !== inputSet.size || ![...finalSet].every(obj => inputSet.has(obj));
    })();
    const specificObjectivesChanged = (() => {
        const finalSet = new Set(finalUserData.specificObjectives || []);
        const inputSet = new Set(input.userData?.specificObjectives || []);
        return finalSet.size !== inputSet.size || ![...finalSet].every(obj => inputSet.has(obj));
    })();
    const expensesIncomeSummaryChanged = finalUserData.expensesIncomeSummary?.status !== input.userData?.expensesIncomeSummary?.status || finalUserData.expensesIncomeSummary?.feedback !== input.userData?.expensesIncomeSummary?.feedback;
    
    const isInitialPopulation = !input.userData && (finalUserData.name || finalUserData.generalObjectives?.length || finalUserData.specificObjectives?.length || finalUserData.expensesIncomeSummary);
    
    const shouldIncludeUserData = nameChanged || generalObjectivesChanged || specificObjectivesChanged || expensesIncomeSummaryChanged || isInitialPopulation;

    return {
      response: chatResponseText,
      updatedUserData: shouldIncludeUserData ? finalUserData : input.userData, // Send current input.userData if no effective change, otherwise new.
      nextExpectedInput: nextExpectedInput,
    };
  }
);
