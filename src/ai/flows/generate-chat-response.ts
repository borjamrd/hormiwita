
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating helpful chatbot responses related to personal finance and banking.
 * It also extracts user information like name and financial objectives.
 *
 * - generateChatResponse - A function that takes user query, chat history, and existing user data,
 *   and returns a chatbot response and potentially updated user data.
 * - GenerateChatResponseInput - The input type for the generateChatResponse function.
 * - GenerateChatResponseOutput - The return type for the generateChatResponse function.
 * - UserData - Type for user's collected information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schema for individual chat messages in history
const ChatMessageHistorySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// Define schema for user data
const UserDataSchema = z.object({
  name: z.string().optional().describe("The user's name."),
  objectives: z.array(z.string()).optional().describe("A list of the user's financial objectives."),
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
});
export type GenerateChatResponseOutput = z.infer<typeof GenerateChatResponseOutputSchema>;

// Tool to extract user's name (acts as a declaration for the LLM)
const extractNameTool = ai.defineTool(
  {
    name: 'extractNameTool',
    description: "A conceptual tool to guide the LLM. If the user provides their name or introduces themselves, the LLM should extract this name.",
    inputSchema: z.object({ query: z.string().describe("The user's message which might contain their name.") }),
    outputSchema: z.object({ name: z.string().optional().describe("The extracted name of the user.") }),
  },
  async (input) => {
    // This placeholder implementation is NOT primarily used for extraction.
    // The LLM is instructed to populate 'extractedName' in its main JSON output.
    return { name: undefined };
  }
);

// Tool to extract financial objectives (acts as a declaration for the LLM)
const extractObjectivesTool = ai.defineTool(
  {
    name: 'extractObjectivesTool',
    description: "A conceptual tool to guide the LLM. If the user discusses their financial goals or what they want to achieve, the LLM should extract these objectives.",
    inputSchema: z.object({ query: z.string().describe("The user's message which might contain their financial objectives.") }),
    outputSchema: z.object({ objectives: z.array(z.string()).optional().describe("A list of extracted financial objectives.") }),
  },
  async (input) => {
    // This placeholder implementation is NOT primarily used for extraction.
    // The LLM is instructed to populate 'extractedObjectives' in its main JSON output.
    return { objectives: undefined };
  }
);

// Schema for the direct output from the LLM prompt
const PromptOutputSchema = z.object({
  textResponse: z.string().describe('The chatbot response to the user query.'),
  extractedName: z.string().optional().describe("The user's name, if extracted in the current turn based on user input and extractNameTool guidance."),
  extractedObjectives: z.array(z.string()).optional().describe("Financial objectives, if extracted in the current turn based on user input and extractObjectivesTool guidance."),
});


export async function generateChatResponse(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}

const systemPrompt = `Eres FinanceFriend, un asistente experto en finanzas personales. Tu objetivo principal es ayudar al usuario a organizar sus finanzas. Para ello, necesitas recopilar información en las siguientes categorías: información personal (nombre), objetivos financieros, relación de gastos e ingresos, información adicional y, finalmente, generar un resumen.

Sigue este orden para recopilar la información:
1.  **Información Personal**: Si aún no conoces el nombre del usuario (es decir, \`userData.name\` no está presente o está vacío), tu primera prioridad es preguntarle su nombre. Si el usuario provee su nombre en la respuesta, extráelo y colócalo en el campo \`extractedName\` de tu respuesta JSON. Ejemplo de pregunta: 'Hola! Para comenzar y dirigirnos mejor, ¿podrías decirme tu nombre?'.
2.  **Objetivos Financieros**: Una vez que tengas el nombre del usuario (es decir, \`userData.name\` está presente) y si aún no conoces sus objetivos (es decir, \`userData.objectives\` no está presente o está vacío), pregúntale sobre sus principales objetivos financieros. Si el usuario provee sus objetivos, extráelos como una lista de strings y colócalos en el campo \`extractedObjectives\` de tu respuesta JSON. Ejemplo de pregunta: 'Gracias, {{userData.name}}. Ahora, cuéntame, ¿cuáles son tus principales objetivos financieros en este momento?'.
3.  **Conversación General**: Si ya tienes el nombre y los objetivos, o si el usuario hace una pregunta general sobre finanzas no relacionada con la recopilación de datos, responde a su consulta de manera útil y concisa en el campo \`textResponse\`.

Instrucciones adicionales:
- Siempre responde en español.
- Mantén las respuestas por debajo de 200 palabras.
- Evita dar recomendaciones de inversión directas.
- Guíate por las descripciones de las herramientas \`extractNameTool\` y \`extractObjectivesTool\` para saber cuándo y qué extraer, pero coloca los resultados en los campos \`extractedName\` y \`extractedObjectives\` de tu respuesta JSON principal. No intentes "llamar" a las herramientas de forma que esperes una respuesta de ellas; tú eres quien provee la información extraída.
- Tu respuesta al usuario (\`textResponse\`) siempre debe ser un mensaje de chat directo. La información extraída se utilizará para actualizar un panel de información en la interfaz de usuario, no la incluyas directamente en tu respuesta de chat a menos que sea natural hacerlo (por ejemplo, para confirmar).
- Revisa el \`chatHistory\` y \`userData\` para entender el contexto actual antes de responder.
- Tu salida debe ser un objeto JSON que cumpla con el esquema proporcionado (PromptOutputSchema), conteniendo \`textResponse\`, y opcionalmente \`extractedName\` y/o \`extractedObjectives\`.`;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  system: systemPrompt,
  tools: [extractNameTool, extractObjectivesTool], // Tools are still declared to inform the LLM
  input: { schema: GenerateChatResponseInputSchema },
  output: { schema: PromptOutputSchema }, 
  prompt:
    `{{#if chatHistory}}
Historial de chat reciente (assistant es FinanceFriend, user es el usuario):
{{#each chatHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

Información del usuario ya conocida (userData):
Nombre: {{#if userData.name}}{{userData.name}}{{else}}No proporcionado{{/if}}
Objetivos: {{#if userData.objectives}}{{#each userData.objectives}}- {{this}} {{/each}}{{else}}No proporcionados{{/if}}

Mensaje actual del usuario:
user: {{query}}

Respuesta JSON de FinanceFriend (assistant) cumpliendo con PromptOutputSchema:
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
      const toolCalls = llmCallResult.response?.parts.filter(p => p.toolRequest).length || 0;
      if (toolCalls > 0 && (!promptOutput || !promptOutput.textResponse)) {
          console.log("Model primarily made tool calls, text response part might be absent or processed by tools.");
      } else {
          throw new Error("LLM output malformed, missing expected 'textResponse' field for the chat response.");
      }
    }
    
    const chatResponseText = promptOutput?.textResponse || "No se pudo generar una respuesta de texto.";

    let cumulativeName = input.userData?.name;
    let cumulativeObjectives = input.userData?.objectives || [];

    if (promptOutput?.extractedName) {
      cumulativeName = promptOutput.extractedName;
    }
    if (promptOutput?.extractedObjectives && promptOutput.extractedObjectives.length > 0) {
      const newObjectives = promptOutput.extractedObjectives;
      // Accumulate objectives, avoiding duplicates
      cumulativeObjectives = Array.from(new Set([...cumulativeObjectives, ...newObjectives]));
    }
    
    const finalUserData: UserData = {
      name: cumulativeName,
      objectives: cumulativeObjectives.length > 0 ? cumulativeObjectives : undefined,
    };
    
    // Determine if userData has actually changed to decide if it should be included in the output
    const nameIsNewOrChanged = finalUserData.name !== input.userData?.name;
    
    const objectivesWereProvided = finalUserData.objectives && finalUserData.objectives.length > 0;
    const oldObjectivesWerePresent = input.userData?.objectives && input.userData.objectives.length > 0;
    
    let objectivesChanged = false;
    if (objectivesWereProvided !== oldObjectivesWerePresent) {
        objectivesChanged = true;
    } else if (objectivesWereProvided && oldObjectivesWerePresent) {
        // Both new and old objectives lists exist, check for content difference
        const finalObjSet = new Set(finalUserData.objectives);
        const inputObjSet = new Set(input.userData!.objectives);
        objectivesChanged = finalUserData.objectives!.length !== input.userData!.objectives!.length ||
                            !finalUserData.objectives!.every(obj => inputObjSet.has(obj)) ||
                            !input.userData!.objectives!.every(obj => finalObjSet.has(obj));
    }


    const isInitialPopulation = !input.userData && (finalUserData.name || (finalUserData.objectives && finalUserData.objectives.length > 0));
    
    const shouldIncludeUserData = nameIsNewOrChanged || objectivesChanged || isInitialPopulation;

    return {
      response: chatResponseText,
      updatedUserData: shouldIncludeUserData ? finalUserData : input.userData,
    };
  }
);
