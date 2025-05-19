
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating helpful chatbot responses related to personal finance and banking.
 * It also extracts user information like name, general financial objectives, and specific financial objectives.
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
  generalObjectives: z.array(z.string()).optional().describe("A list of the user's general financial objectives."),
  specificObjectives: z.array(z.string()).optional().describe("A list of the user's specific financial objectives, related to their general ones."),
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
  nextExpectedInput: z.enum(["name", "general_objectives_selection", "specific_objectives_selection", "general_conversation"]).optional().describe("Hint for the frontend on what kind of input is expected next. 'name' if AI is asking for name. 'general_objectives_selection' if AI is asking for general objectives. 'specific_objectives_selection' if AI is asking for specific objectives. 'general_conversation' otherwise.")
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
      // generalObjectives: z.array(z.string()).optional().describe("The general objectives already identified, to provide context."), // Context passed in prompt
    }),
    outputSchema: z.object({ specificObjectives: z.array(z.string()).optional().describe("A list of extracted specific financial objectives.") }),
  },
  async (input) => {
    return { specificObjectives: undefined };
  }
);


// Schema for the direct output from the LLM prompt
const PromptOutputSchema = z.object({
  textResponse: z.string().describe('The chatbot response to the user query.'),
  extractedName: z.string().nullable().optional().describe("The user's name, if extracted in the current turn based on user input and extractNameTool guidance."),
  extractedGeneralObjectives: z.array(z.string()).nullable().optional().describe("General financial objectives, if extracted in the current turn based on user input and extractGeneralObjectivesTool guidance."),
  extractedSpecificObjectives: z.array(z.string()).nullable().optional().describe("Specific financial objectives, if extracted in the current turn based on user input and extractSpecificObjectivesTool guidance."),
  nextExpectedInput: z.enum(["name", "general_objectives_selection", "specific_objectives_selection", "general_conversation"]).optional().describe("Indicates the type of input the AI is expecting next.")
});


export async function generateChatResponse(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}

const systemPrompt = `Eres FinanceFriend, un asistente experto en finanzas personales. Tu objetivo principal es ayudar al usuario a organizar sus finanzas. Para ello, necesitas recopilar información en las siguientes categorías: información personal (nombre), objetivos generales, objetivos concretos, relación de gastos e ingresos, información adicional y, finalmente, generar un resumen.

Sigue este orden para recopilar la información y establece el campo \`nextExpectedInput\` en tu respuesta JSON según corresponda:
1.  **Información Personal**: Si aún no conoces el nombre del usuario (es decir, \`userData.name\` no está presente o está vacío), tu primera prioridad es preguntarle su nombre. Establece \`nextExpectedInput: "name"\`. Si el usuario provee su nombre en la respuesta, extráelo y colócalo en el campo \`extractedName\`. Ejemplo de pregunta: 'Hola! Para comenzar y dirigirnos mejor, ¿podrías decirme tu nombre?'.
2.  **Objetivos Generales**: Una vez que tengas el nombre del usuario (es decir, \`userData.name\` está presente) y si aún no conoces sus objetivos generales (es decir, \`userData.generalObjectives\` no está presente o está vacío), pregúntale sobre sus principales objetivos financieros generales. Establece \`nextExpectedInput: "general_objectives_selection"\`. Si el usuario provee sus objetivos generales (ya sea por texto o por una selección), extráelos como una lista de strings y colócalos en el campo \`extractedGeneralObjectives\`. Ejemplo de pregunta: 'Gracias, {{userData.name}}. Ahora, cuéntame, ¿cuáles son tus principales objetivos financieros generales en este momento? (Puedes seleccionar de una lista o escribirlos)'.
3.  **Objetivos Concretos**: Una vez que tengas los objetivos generales del usuario (es decir, \`userData.generalObjectives\` está presente y no vacío) y si aún no conoces sus objetivos concretos (es decir, \`userData.specificObjectives\` no está presente o está vacío), pregúntale sobre sus objetivos financieros concretos, relacionados con los generales que mencionó. Establece \`nextExpectedInput: "specific_objectives_selection"\`. Si el usuario provee sus objetivos concretos, extráelos y colócalos en \`extractedSpecificObjectives\`. Ejemplo de pregunta (si seleccionó 'Ahorro' como objetivo general): 'Entendido. Dentro de Ahorro, ¿tienes algunos objetivos más específicos en mente, como crear un fondo de emergencia, ahorrar para la jubilación, o algo similar?'.
4.  **Conversación General**: Si ya tienes el nombre, objetivos generales y objetivos concretos, o si el usuario hace una pregunta general sobre finanzas no relacionada con la recopilación de datos, responde a su consulta de manera útil y concisa en el campo \`textResponse\`. Establece \`nextExpectedInput: "general_conversation"\`.

Instrucciones adicionales:
- Siempre responde en español.
- Mantén las respuestas por debajo de 200 palabras.
- Evita dar recomendaciones de inversión directas.
- Guíate por las descripciones de las herramientas \`extractNameTool\`, \`extractGeneralObjectivesTool\` y \`extractSpecificObjectivesTool\` para saber cuándo y qué extraer, pero coloca los resultados en los campos \`extractedName\`, \`extractedGeneralObjectives\` y \`extractedSpecificObjectives\` de tu respuesta JSON principal.
- Tu respuesta al usuario (\`textResponse\`) siempre debe ser un mensaje de chat directo.
- Revisa el \`chatHistory\` y \`userData\` para entender el contexto actual.
- Tu salida debe ser un objeto JSON que cumpla con el esquema proporcionado (PromptOutputSchema).`;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  system: systemPrompt,
  tools: [extractNameTool, extractGeneralObjectivesTool, extractSpecificObjectivesTool],
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
Objetivos Generales: {{#if userData.generalObjectives}}{{#each userData.generalObjectives}}- {{this}} {{/each}}{{else}}No proporcionados{{/if}}
Objetivos Concretos: {{#if userData.specificObjectives}}{{#each userData.specificObjectives}}- {{this}} {{/each}}{{else}}No proporcionados{{/if}}

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
      // Fallback for text response if entirely missing, but prefer logging and using extracted data if possible
      // Avoid crashing if only textResponse is missing but other data is fine
      console.warn("LLM output malformed, 'textResponse' field is missing. Proceeding with extracted data if any.");
    }
    
    const chatResponseText = promptOutput?.textResponse || "No se pudo generar una respuesta de texto."; // Ensure chatResponseText is always a string
    const nextExpectedInput = promptOutput?.nextExpectedInput || "general_conversation";

    // Initialize cumulative data with existing userData or defaults
    let cumulativeName = input.userData?.name; // string | undefined
    let cumulativeGeneralObjectives = input.userData?.generalObjectives || []; // string[]
    let cumulativeSpecificObjectives = input.userData?.specificObjectives || []; // string[]

    // Update with extracted data if present and not null
    // The .optional() and .nullable() in PromptOutputSchema handle undefined/null from LLM
    // Here, we only update if the value is truthy (i.e., an actual string or non-empty array)
    if (promptOutput?.extractedName) { // Only updates if extractedName is a non-empty string
      cumulativeName = promptOutput.extractedName;
    }
    if (promptOutput?.extractedGeneralObjectives && promptOutput.extractedGeneralObjectives.length > 0) {
      // Combine and remove duplicates
      cumulativeGeneralObjectives = Array.from(new Set([...cumulativeGeneralObjectives, ...promptOutput.extractedGeneralObjectives]));
    }
    if (promptOutput?.extractedSpecificObjectives && promptOutput.extractedSpecificObjectives.length > 0) {
      // Combine and remove duplicates
      cumulativeSpecificObjectives = Array.from(new Set([...cumulativeSpecificObjectives, ...promptOutput.extractedSpecificObjectives]));
    }
    
    // Construct final user data, ensuring optional fields are undefined if empty/not set
    const finalUserData: UserData = {
      name: cumulativeName, // Will be string or undefined
      generalObjectives: cumulativeGeneralObjectives.length > 0 ? cumulativeGeneralObjectives : undefined,
      specificObjectives: cumulativeSpecificObjectives.length > 0 ? cumulativeSpecificObjectives : undefined,
    };
    
    // Determine if userData should be included in the response
    // It should be included if it's the initial population or if any relevant field changed
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
    
    const isInitialPopulation = !input.userData && (finalUserData.name || finalUserData.generalObjectives?.length || finalUserData.specificObjectives?.length);
    
    const shouldIncludeUserData = nameChanged || generalObjectivesChanged || specificObjectivesChanged || isInitialPopulation;

    return {
      response: chatResponseText,
      updatedUserData: shouldIncludeUserData ? finalUserData : input.userData, // Send back original if no relevant change
      nextExpectedInput: nextExpectedInput,
    };
  }
);

