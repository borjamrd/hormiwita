// src/ai/flows/objectives/vehicle-savings-flow.ts
import { ai } from "@/ai/genkit";
import { z } from "genkit";

// El schema del mensaje no cambia
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const vehicleSavingsFlow = ai.defineFlow(
  {
    name: "vehicleSavingsFlow",
    inputSchema: z.object({
      history: z.array(ChatMessageSchema),
    }),
    // 1. AÑADIMOS: Definimos el tipo de dato que se va a streamear (chunks de texto)
    streamSchema: z.string(),
    // El output final sigue siendo el texto completo
    outputSchema: z.string(),
  },
  // 2. AÑADIMOS: El segundo parámetro { sendChunk } para poder emitir los datos
  async ({ history }, { sendChunk }) => {
    const systemPrompt = `
      Eres un asesor financiero amigable y motivador llamado Hormi. No te presentes.
      Tu objetivo es guiar al usuario para crear un plan de ahorro para comprar un vehículo.
      Tu tono debe ser alentador y debes hacer una sola pregunta a la vez.
      Usa este historial de conversación como contexto.
      Si el historial está vacío, haz la primera pregunta clave: "¿Cuál es el coste estimado del vehículo que tienes en mente?"
    `;

    // Hacemos el mapeo más robusto

    let result;

    // APLICAMOS TU LÓGICA:
    if (!history || history.length === 0) {
      // 1. Si el historial está vacío, llamamos a la IA solo con el prompt.
      // Esto genera el saludo inicial.
      result = ai.generateStream({
        prompt: systemPrompt,
      });
    } else {
      // 2. Si ya hay historial, lo usamos para dar contexto.

      // Para cumplir la regla de la API "user-then-model", ignoramos el saludo
      // inicial del asistente que nos llega desde el cliente.
      const historyForApi =
        history[0]?.role === "assistant" ? history.slice(1) : history;

      const modelHistory = historyForApi
        .filter((msg): msg is z.infer<typeof ChatMessageSchema> => !!msg)
        .map((message) => ({
          role: (message.role === "assistant" ? "model" : "user") as any,
          content: [{ text: message.content ?? "" }],
        }));

      result = ai.generateStream({
        messages: [
          // Incluimos el systemPrompt para que la IA no olvide su personalidad
          { role: "system", content: [{ text: systemPrompt }] },
          ...modelHistory,
        ],
      });
    }
    // 4. AÑADIMOS: Un bucle para procesar el stream
    for await (const chunk of result.stream) {
      // Enviamos cada trozo de texto al cliente a medida que llega
      if (chunk.text) {
        sendChunk(chunk.text);
      }
    }

    // El flujo puede igualmente devolver la respuesta completa al final
    const fullResponse = await result.response;
    return fullResponse.text;
  }
);
