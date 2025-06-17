// src/ai/flows/generate-objective-roadmap.ts
import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { getFlowIdentifier } from "@/lib/objectives-config";

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
      Eres un asesor financiero amigable y motivador llamado Hormi.
      Tu tarea es crear un "roadmap" financiero para un usuario llamado ${name}.
      Sus objetivos específicos son: ${specificObjectives.join(", ")}.
      Basado en estos objetivos, genera un roadmap con una 'introduction' cálida y una lista de 'steps'.
      Para cada step, genera solo las propiedades 'objective' (el nombre exacto del objetivo), 'title' (un título creativo) y 'description' (una descripción de 1-2 frases).
      NO generes la propiedad 'flowIdentifier'.
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      output: {
        format: "json",
        schema: RoadmapSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      return { introduction: "No se pudo generar un plan.", steps: [] };
    }

    output.steps.forEach((step) => {
      const identifier = getFlowIdentifier(step.objective);
      step.flowIdentifier = identifier || "defaultFallbackFlow"; 
     });
  
    return output;
  }
);
