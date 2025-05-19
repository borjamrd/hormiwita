
'use server';
/**
 * @fileOverview Categorizes financial transaction items (income or expenses) using an AI model.
 *
 * - categorizeFinancialData - Function to categorize a list of provider transaction summaries.
 * - CategorizationInput - Input type for the categorization flow.
 * - CategorizedItem - Output type for a single categorized item.
 * - CategorizationOutput - Output type for the categorization flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define ProviderTransactionSummarySchema locally as it cannot be imported from a 'use server' file.
// This must be identical to the definition in analyze-bank-statements.ts's output part.
const ProviderTransactionSummarySchema = z.object({
  providerName: z.string().describe("Nombre normalizado del proveedor, comercio, pagador o beneficiario."),
  totalAmount: z.number().describe("Monto total para este proveedor. Siempre un número positivo. La categoría (ingreso/gasto) define su naturaleza."),
  transactionCount: z.number().int().describe("Número de transacciones con este proveedor."),
});

// Esquema de ENTRADA para el flujo de categorización - NO EXPORTAR OBJETO ZOD
const CategorizationInputSchema = z.object({
  itemsToCategorize: z.array(ProviderTransactionSummarySchema)
    .describe("Lista de elementos de proveedor (ingresos o gastos) a categorizar."),
  itemType: z.enum(["income", "expense"]).describe("Indica si los items son ingresos o gastos, para ayudar a la IA."),
  existingCategories: z.array(z.string()).optional()
    .describe("Lista opcional de categorías preexistentes para guiar a la IA. Ej: ['Alimentación', 'Transporte', 'Nómina']."),
  language: z.string().optional().default('es').describe("Idioma deseado para las categorías sugeridas.")
});
export type CategorizationInput = z.infer<typeof CategorizationInputSchema>;

// Esquema de SALIDA para cada item categorizado - NO EXPORTAR OBJETO ZOD
const CategorizedItemSchema = ProviderTransactionSummarySchema.extend({
  suggestedCategory: z.string().describe("Categoría financiera sugerida para este proveedor/concepto."),
  // itemType is implicitly known from the input, but not added to each item by the AI here
});
export type CategorizedItem = z.infer<typeof CategorizedItemSchema>;

// Esquema de SALIDA principal del flujo de categorización - NO EXPORTAR OBJETO ZOD
const CategorizationOutputSchema = z.object({
  categorizedItems: z.array(CategorizedItemSchema),
});
export type CategorizationOutput = z.infer<typeof CategorizationOutputSchema>;

const categorizationPromptText = `Eres un asistente experto en finanzas personales que ayuda a categorizar transacciones.
Recibirás una lista de transacciones previamente agregadas por proveedor (o concepto), junto con si son ingresos o gastos, y una lista opcional de categorías existentes.
Para cada proveedor, debes sugerir la categoría financiera más adecuada en {{language}}.

Lista de categorías preferidas (si se proporciona, intenta usar una de estas para los items de tipo '{{itemType}}'):
{{#if existingCategories}}
{{#each existingCategories}}
- {{this}}
{{/each}}
{{else}}
(No se proporcionó una lista de categorías predefinidas, usa tu conocimiento general o sugiere categorías comunes en {{language}} apropiadas para '{{itemType}}')
{{/if}}

Tipo de items: {{itemType}}

Items a categorizar (basándote en 'providerName'):
{{#each itemsToCategorize}}
- Provider: "{{providerName}}", Total: {{totalAmount}}
{{/each}}

Responde EXCLUSIVAMENTE con un objeto JSON que siga el esquema 'CategorizationOutputSchema', donde cada item de entrada tenga un campo 'suggestedCategory' añadido.
Si 'existingCategories' fue proporcionada y un item no encaja claramente, puedes usar una categoría general como "Otros Gastos" o "Otros Ingresos" (según 'itemType'), o si crees que es una categoría nueva y útil, puedes proponerla (en {{language}}). Asegúrate de que el objeto JSON principal tenga una clave "categorizedItems" que contenga la lista de items con sus categorías sugeridas.

Ejemplo de cómo categorizarías (si itemType es 'expense' y language es 'es'):
Input Provider: "Mercadona S.A." -> suggestedCategory: "Alimentación y Supermercado"
Input Provider: "Netflix" -> suggestedCategory: "Ocio y Entretenimiento"
Input Provider: "RENFE Viajeros" -> suggestedCategory: "Transporte"

Ejemplo de cómo categorizarías (si itemType es 'income' y language es 'es'):
Input Provider: "EMPRESA XYZ S.L. NOMINA" -> suggestedCategory: "Ingresos por Nómina"
Input Provider: "Alquiler Piso Calle Falsa" -> suggestedCategory: "Ingresos por Alquiler"
`;

const categorizationPrompt = ai.definePrompt({
  name: 'categorizeFinancialItemsPrompt',
  input: { schema: CategorizationInputSchema },
  output: { schema: CategorizationOutputSchema },
  prompt: categorizationPromptText,
});

export async function categorizeFinancialData(input: CategorizationInput): Promise<CategorizationOutput> {
  // Input validation is implicitly handled by Genkit based on the schema.
  
  const { output } = await categorizationPrompt(input);

  if (!output || !output.categorizedItems) {
    console.error("La IA no pudo generar categorías o la respuesta no fue válida. Input:", input);
    // Fallback: return items with a default "Other" category
    const defaultCategory = input.itemType === 'income' ? "Otros Ingresos" : "Otros Gastos";
    return { 
      categorizedItems: input.itemsToCategorize.map(item => ({
        ...item, 
        suggestedCategory: defaultCategory
      })) 
    };
  }
  return output;
}
