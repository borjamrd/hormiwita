// src/ai/flows/generate-objective-roadmap.ts
import { ai } from "@/ai/genkit"; // Importamos el objeto 'ai' centralizado
import { z } from "genkit";

// El mapa de identificadores sigue igual
const objectiveToFlowIdentifier: Record<string, string> = {
  "Fondo de Emergencia": "emergencyFundFlow",
  "Ahorro para la Jubilación": "retirementSavingsFlow",
  "Ahorro para la Entrada de una Vivienda": "housingDownPaymentFlow",
  "Ahorro para la Compra de un Vehículo": "vehicleSavingsFlow",
  // ... resto de objetivos
};

// Usamos z para definir los esquemas
export const RoadmapStepSchema = z.object({
  objective: z.string().describe("The specific objective for this step."),
  title: z.string().describe("A short, engaging title for this roadmap step."),
  description: z
    .string()
    .describe(
      "A brief, encouraging description of what will be covered in this step."
    ),
  flowIdentifier: z
    .string()
    .describe(
      "A unique key to identify the specific Genkit flow for this objective."
    ),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
});

export const RoadmapSchema = z.object({
  introduction: z
    .string()
    .describe(
      "A personalized and welcoming introduction message for the user."
    ),
  steps: z.array(RoadmapStepSchema),
});

// Usamos ai.defineFlow para crear el flujo
export const generateObjectiveRoadmap = ai.defineFlow(
  {
    name: "generateObjectiveRoadmap",
    inputSchema: z.object({
      name: z.string(),
      specificObjectives: z.array(z.string()),
    }),
    outputSchema: RoadmapSchema,
  },
  async (input) => {
    const { name, specificObjectives } = input;

    const prompt = `
      Eres un asesor financiero amigable y motivador.
      Tu tarea es crear un "roadmap" financiero personalizado para un usuario.

      Datos del usuario:
      - Nombre: ${name}
      - Objetivos específicos: ${specificObjectives.join(", ")}

      Instrucciones:
      1.  Crea un mensaje de introducción cálido y personalizado con el nombre del usuario, felicitándole por sus objetivos.
      2.  Para cada objetivo específico, genera un paso en el roadmap que incluya:
          - 'objective': El nombre exacto del objetivo.
          - 'title': Un título corto, creativo y motivador.
          - 'description': Una descripción de 1-2 frases sobre lo que se hará.
          - 'flowIdentifier': El identificador de flujo correspondiente usando el mapa proporcionado.
          - 'status': Siempre 'pending'.
      3.  Responde EXCLUSIVAMENTE con un objeto JSON válido que se ajuste al schema.

      Mapa de 'objective' a 'flowIdentifier':
      ${JSON.stringify(objectiveToFlowIdentifier, null, 2)}
    `;

    // Usamos ai.model para acceder al modelo
    const llmResponse = await ai.generate({
      prompt: prompt,
      output: {
        format: "json",
        schema: RoadmapSchema,
      },
    });

    return llmResponse.output ?? { introduction: "", steps: [] };
  }
);
