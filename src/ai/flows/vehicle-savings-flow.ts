// src/ai/flows/objectives/vehicle-savings-flow.ts
import { ai } from "@/ai/genkit";
import { z } from "genkit";

// El schema del mensaje no cambia
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const UserDataContextSchema = z
  .object({
    name: z.string().optional(),
    expensesIncomeSummary: z
      .object({
        originalSummary: z.object({
          totalIncome: z.number().optional(),
          totalExpenses: z.number().optional(),
        }),
      })
      .optional(),
  })
  .optional();

export const vehicleSavingsFlow = ai.defineFlow(
  {
    name: "vehicleSavingsFlow",
    inputSchema: z.object({
      history: z.array(ChatMessageSchema),
      userData: UserDataContextSchema,
    }),
    streamSchema: z.string(),
    outputSchema: z.string(),
  },
  async ({ history, userData }, { sendChunk }) => {
    const financialContext = userData?.expensesIncomeSummary?.originalSummary
      ? `
        Aquí tienes un resumen de la situación financiera del usuario para que tus consejos sean más precisos:
        - Nombre: ${userData.name || "No especificado"}
        - Ingresos mensuales aproximados: ${
          userData.expensesIncomeSummary.originalSummary.totalIncome ||
          "No disponible"
        }
        - Gastos mensuales aproximados: ${
          userData.expensesIncomeSummary.originalSummary.totalExpenses ||
          "No disponible"
        }
      `
      : "No se dispone del contexto financiero del usuario.";

    const systemPrompt = `
      Eres un asesor financiero amigable y motivador llamado Hormi.
      ${financialContext}
      Tu objetivo es guiar al usuario para crear un plan de ahorro para comprar un vehículo.
      Tu tono debe ser alentador y debes hacer una sola pregunta a la vez.
    `;

    let result;

    if (!history || history.length === 0) {
      result = ai.generateStream({
        prompt: systemPrompt,
      });
    } else {
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
          { role: "system", content: [{ text: systemPrompt }] },
          ...modelHistory,
        ],
      });
    }
    for await (const chunk of result.stream) {
      if (chunk.text) {
        sendChunk(chunk.text);
      }
    }

    const fullResponse = await result.response;
    return fullResponse.text;
  }
);
