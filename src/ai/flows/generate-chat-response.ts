
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

// Define output schema for the main flow
const GenerateChatResponseOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
  updatedUserData: UserDataSchema.optional().describe('Updated user data after processing the query, including any newly extracted information.'),
});
export type GenerateChatResponseOutput = z.infer<typeof GenerateChatResponseOutputSchema>;

// Tool to extract user's name
const extractNameTool = ai.defineTool(
  {
    name: 'extractNameTool',
    description: "Extracts the user's name if mentioned in the query. Use this tool if the user provides their name or introduces themselves.",
    inputSchema: z.object({ query: z.string().describe("The user's message which might contain their name.") }),
    outputSchema: z.object({ name: z.string().optional().describe("The extracted name of the user.") }),
  },
  async (input) => {
    // This is a placeholder for the LLM to fill.
    return { name: undefined };
  }
);

// Tool to extract financial objectives
const extractObjectivesTool = ai.defineTool(
  {
    name: 'extractObjectivesTool',
    description: "Extracts a list of financial objectives if mentioned in the query. Use this tool if the user discusses their financial goals or what they want to achieve.",
    inputSchema: z.object({ query: z.string().describe("The user's message which might contain their financial objectives.") }),
    outputSchema: z.object({ objectives: z.array(z.string()).optional().describe("A list of extracted financial objectives.") }),
  },
  async (input) => {
    // Placeholder for LLM to fill.
    return { objectives: undefined };
  }
);

// Schema to workaround model returning an object for a string output
const ModelWorkaroundOutputSchema = z.object({
  description: GenerateChatResponseOutputSchema.shape.response, // This is z.string().describe('The chatbot response...')
  type: z.string().optional().describe("An optional type field, often 'string', sometimes output by the model."),
});


export async function generateChatResponse(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}

const systemPrompt = `Eres FinanceFriend, un asistente experto en finanzas personales. Tu objetivo principal es ayudar al usuario a organizar sus finanzas. Para ello, necesitas recopilar información en las siguientes categorías: información personal (nombre), objetivos financieros, relación de gastos e ingresos, información adicional y, finalmente, generar un resumen.

Sigue este orden para recopilar la información:
1.  **Información Personal**: Si aún no conoces el nombre del usuario (es decir, \`userData.name\` no está presente o está vacío), tu primera prioridad es preguntarle su nombre. Utiliza la herramienta \`extractNameTool\` si el usuario provee su nombre en la respuesta. Ejemplo de pregunta: 'Hola! Para comenzar y dirigirnos mejor, ¿podrías decirme tu nombre?'.
2.  **Objetivos Financieros**: Una vez que tengas el nombre del usuario (es decir, \`userData.name\` está presente) y si aún no conoces sus objetivos (es decir, \`userData.objectives\` no está presente o está vacío), pregúntale sobre sus principales objetivos financieros. Utiliza la herramienta \`extractObjectivesTool\` si el usuario provee sus objetivos. Ejemplo de pregunta: 'Gracias, {{userData.name}}. Ahora, cuéntame, ¿cuáles son tus principales objetivos financieros en este momento?'.
3.  **Conversación General**: Si ya tienes el nombre y los objetivos, o si el usuario hace una pregunta general sobre finanzas no relacionada con la recopilación de datos, responde a su consulta de manera útil y concisa.

Instrucciones adicionales:
- Siempre responde en español.
- Mantén las respuestas por debajo de 200 palabras.
- Evita dar recomendaciones de inversión directas.
- Utiliza las herramientas \`extractNameTool\` y \`extractObjectivesTool\` ÚNICAMENTE cuando creas que el usuario ha proporcionado la información relevante para el nombre o los objetivos en su mensaje actual. No las uses para hacer preguntas.
- Tu respuesta al usuario siempre debe ser un mensaje de chat directo. La información extraída por las herramientas se utilizará para actualizar un panel de información en la interfaz de usuario, no la incluyas directamente en tu respuesta de chat a menos que sea natural hacerlo (por ejemplo, para confirmar).
- Revisa el \`chatHistory\` y \`userData\` para entender el contexto actual antes de responder.
`;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  system: systemPrompt,
  tools: [extractNameTool, extractObjectivesTool],
  input: { schema: GenerateChatResponseInputSchema },
  output: { schema: ModelWorkaroundOutputSchema }, // Use the workaround schema here
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

Respuesta de FinanceFriend (assistant):
`,
});


const generateChatResponseFlow = ai.defineFlow(
  {
    name: 'generateChatResponseFlow',
    inputSchema: GenerateChatResponseInputSchema,
    outputSchema: GenerateChatResponseOutputSchema, // Flow output schema remains the same
  },
  async (input) => {
    const llmCallResult = await prompt(input); // llmCallResult contains the model's response

    const chatResponseText = llmCallResult.output?.description;

    if (chatResponseText === undefined) {
      console.error("LLM output object did not contain a 'description' field with the chat text:", llmCallResult.output);
      throw new Error("LLM output malformed, missing expected 'description' field for the chat response.");
    }

    let updatedName = input.userData?.name;
    let updatedObjectives = input.userData?.objectives || [];

    for (const part of llmCallResult.parts) {
      if (part.toolResponse) {
        if (part.toolResponse.name === 'extractNameTool' && part.toolResponse.output?.name) {
           updatedName = part.toolResponse.output.name as string;
        }
        if (part.toolResponse.name === 'extractObjectivesTool' && part.toolResponse.output?.objectives) {
           const newObjectives = part.toolResponse.output.objectives as string[];
           // Avoid duplicates
           updatedObjectives = Array.from(new Set([...(updatedObjectives || []), ...newObjectives]));
        }
      }
    }
    
    const finalUserData: UserData = {
      name: updatedName,
      objectives: updatedObjectives.length > 0 ? updatedObjectives : undefined,
    };
    
    const shouldIncludeUserData = (finalUserData.name && finalUserData.name !== input.userData?.name) || 
                                 (finalUserData.objectives && finalUserData.objectives.some(obj => !(input.userData?.objectives || []).includes(obj))) ||
                                 ((input.userData?.objectives || []).length !== (finalUserData.objectives || []).length) ||
                                 // Ensure userData is included if it's the first time we're setting it, even if empty initially
                                 (!input.userData && (finalUserData.name || finalUserData.objectives));


    return {
      response: chatResponseText, // Use the extracted text
      updatedUserData: shouldIncludeUserData ? finalUserData : (input.userData || {}),
    };
  }
);

