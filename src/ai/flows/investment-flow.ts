// src/ai/flows/objectives/investmentSavingsFlow.ts
import { ai } from "@/ai/genkit";
import { z } from "genkit";

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

export const investmentSavingsFlow = ai.defineFlow(
  {
    name: "investmentSavingsFlow",
    inputSchema: z.object({
      history: z.array(ChatMessageSchema.nullable()),
      userData: UserDataContextSchema,
    }),
    streamSchema: z.string(),
    outputSchema: z.string(),
  },
  async ({ history, userData }, { sendChunk }) => {
    const financialContext = userData?.expensesIncomeSummary?.originalSummary
      ? `
        Contexto financiero del usuario:
        - Nombre: ${userData.name || "No especificado"}
        - Ingresos mensuales: ${
          userData.expensesIncomeSummary.originalSummary.totalIncome ||
          "No disponible"
        }
        - Gastos mensuales: ${
          userData.expensesIncomeSummary.originalSummary.totalExpenses ||
          "No disponible"
        }
      `
      : "No se dispone del contexto financiero del usuario.";

    const systemPrompt = `
      Eres un asesor financiero amigable y motivador llamado Hormi. Tu objetivo es guiar al usuario para que cree un capital inicial para invertir.
      ${financialContext}
      Tu tono debe ser alentador y educativo. Haz una sola pregunta a la vez.
      Si el historial está vacío, haz la primera pregunta clave: "¿Qué tipo de inversor te consideras o te gustaría ser? Por ejemplo, ¿conservador, moderado o arriesgado?"
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
