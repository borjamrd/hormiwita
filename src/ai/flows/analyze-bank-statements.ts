
'use server';
/**
 * @fileOverview Analiza archivos de extractos bancarios (texto CSV proporcionado mediante Data URI)
 * para ofrecer un resumen financiero, incluyendo desglose de ingresos/gastos por proveedor.
 *
 * - analyzeBankStatement - Una función que procesa texto CSV de extractos bancarios.
 * - AnalyzeBankStatementInput - El tipo de entrada para la función analyzeBankStatement.
 * - BankStatementSummary - El tipo de retorno (resumen) para la función analyzeBankStatement.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Esquema de entrada para la función exportada - espera un Data URI de texto CSV
const AnalyzeBankStatementDataUriInputSchema = z.object({
  statementDataUri: z
    .string()
    .describe(
      "Contenido de un archivo de extracto bancario (texto CSV, potencialmente convertido desde Excel por el cliente) como un Data URI. Formato esperado: 'data:text/csv;base64,<datos_codificados>'."
    ),
  originalFileName: z.string().optional().describe("Nombre original del archivo subido, para contexto."),
});
export type AnalyzeBankStatementInput = z.infer<typeof AnalyzeBankStatementDataUriInputSchema>;

// --- Definiciones de Esquemas para la Salida Detallada ---

const ProviderTransactionSummarySchema = z.object({
  providerName: z.string().describe("Nombre normalizado del proveedor, comercio, pagador o beneficiario."),
  totalAmount: z.number().describe("Monto total para este proveedor. Siempre un número positivo. La categoría (ingreso/gasto) define su naturaleza."),
  transactionCount: z.number().int().describe("Número de transacciones con este proveedor."), // Removed .positive()
  // currency: z.string().optional().describe("Código de moneda (ej. EUR), si es específico para este proveedor y difiere del general."), // Opcional, si se necesita granularidad de moneda
});

// Esquema para la salida (resumen) del flujo de análisis - AHORA MÁS DETALLADO
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified"])
    // Los valores del enum se mantienen en inglés para consistencia programática.
    // Significados: "Éxito", "Datos Parciales", "Error de Análisis", "Sin Datos Identificados"
    .describe("Estado del análisis basado en el contenido del archivo proporcionado."),
  feedback: z.string().describe("Un breve resumen textual general o retroalimentación sobre el análisis. Puede mencionar la moneda principal si se detecta."),
  
  incomeByProvider: z.array(ProviderTransactionSummarySchema).optional()
    .describe("Lista de fuentes de ingresos, agrupadas por proveedor/pagador, con sus montos totales."),
  expensesByProvider: z.array(ProviderTransactionSummarySchema).optional()
    .describe("Lista de gastos, agrupados por proveedor/comercio, con sus montos totales."),
  
  totalIncome: z.number().optional().describe("Ingreso total numérico identificado en el extracto."),
  totalExpenses: z.number().optional().describe("Gasto total numérico identificado en el extracto (representado como un número positivo)."),
  detectedCurrency: z.string().optional().describe("Código de moneda principal detectado en el extracto (ej. EUR, USD, GBP)."),
  unassignedTransactions: z.number().int().optional().describe("Número de transacciones que no pudieron ser claramente asignadas a ingresos o gastos, o a un proveedor específico."),
});
export type BankStatementSummary = z.infer<typeof BankStatementSummarySchema>;

// Esquema interno para el prompt - espera contenido textual
const PromptInputSchema = z.object({
  statementTextContent: z.string().describe('El contenido textual del extracto bancario (datos CSV).'),
  originalFileName: z.string().optional().describe('Nombre original del archivo subido, para contexto.'),
});


// --- Prompt de Genkit Actualizado (en Español) ---
const analysisPrompt = ai.definePrompt({
  name: 'analyzeBankStatementDetailedPrompt_es', // Nombre del prompt, opcionalmente con sufijo _es
  input: { schema: PromptInputSchema },
  output: { schema: BankStatementSummarySchema },
  prompt: `Eres una IA experta en análisis de datos financieros. Tu tarea es analizar el contenido textual del extracto bancario proporcionado, que está en formato CSV.
Los datos CSV pueden tener diversos órdenes de columnas para fecha, descripción, débito, crédito o importe. Necesitas inferir estas columnas.

Nombre original del archivo para contexto (si está disponible): {{#if originalFileName}}{{originalFileName}}{{else}}No proporcionado{{/if}}

Contenido textual del extracto a analizar:
\`\`\`
{{{statementTextContent}}}
\`\`\`

Tu análisis debe realizar los siguientes pasos:
1.  Interpretar (parsear) transacciones individuales del texto CSV. Identifica elementos clave como fecha, descripción e importe para cada una.
2.  Distinguir entre INGRESOS (dinero recibido) y GASTOS (dinero pagado).
    * Si el CSV tiene columnas separadas de débito y crédito, úsalas.
    * Si hay una única columna de importe, los valores negativos podrían ser gastos y los positivos ingresos, o viceversa. Infiere la convención del extracto.
    * Si los importes son siempre positivos, básate en palabras clave en las descripciones de las transacciones (ej., "nómina", "pago", "compra", "transferencia a", "transferencia de").
3.  Para cada transacción, intenta identificar un nombre conciso y normalizado para el PROVEEDOR (el pagador para los ingresos, o el beneficiario/comercio para los gastos).
    * Ejemplos: "Nómina de ACME Corporation" -> "ACME Corporation"; "Compra en AMAZON.CO.UK MKTPLC" -> "Amazon"; "BIZUM RECIBIDO DE Juan Pérez" -> "Juan Pérez"; "Supermercado Local S.L." -> "Supermercado Local".
    * Agrupa proveedores similares aunque sus descripciones varíen ligeramente. Por ejemplo, "Bar Pepe" y "BAR PEPE MADRID" idealmente deberían agruparse como "Bar Pepe".
4.  Agregar transacciones:
    * Suma todos los importes para cada proveedor único identificado dentro de la categoría INGRESOS. Almacena esto en 'incomeByProvider'.
    * Suma todos los importes para cada proveedor único identificado dentro de la categoría GASTOS. Almacena esto en 'expensesByProvider'.
    * Todos los valores 'totalAmount' dentro de estos arrays deben ser números positivos.
    * El campo 'transactionCount' debe ser un número entero que represente el número de transacciones para ese proveedor.
5.  Calcular totales generales:
    * 'totalIncome': Suma de todos los ingresos identificados.
    * 'totalExpenses': Suma de todos los gastos identificados (como un número positivo).
6.  Intenta identificar la moneda principal utilizada en el extracto (ej., EUR, USD, GBP). Informa de esto en 'detectedCurrency'. Todos los importes monetarios en la salida estructurada (totalAmount, totalIncome, totalExpenses) DEBEN ser números puros, sin símbolos de moneda ni separadores de miles como comas. Usa un punto para los decimales si es necesario.
7.  Cuenta cualquier transacción que hayas podido interpretar pero que no hayas podido asignar con confianza a un proveedor o categorizar como ingreso/gasto, e informa de esto en 'unassignedTransactions'.

Genera una respuesta JSON estructurada que se ajuste estrictamente al esquema 'BankStatementSummarySchema'.

Ejemplo de ítems deseados para 'ProviderTransactionSummarySchema':
Para incomeByProvider: { "providerName": "ACME Corp", "totalAmount": 3500, "transactionCount": 2 }
Para expensesByProvider: { "providerName": "Amazon", "totalAmount": 125.50, "transactionCount": 5 }

Prioriza la exactitud. Si los datos son insuficientes o demasiado ambiguos para un desglose detallado, refléjalo en 'status' y 'feedback'.

- Para 'status' (usa estos valores exactos en inglés):
    - "Success": Si puedes interpretar los datos y proporcionar el desglose detallado de ingresos/gastos.
    - "Partial Data": Si algunos datos son comprensibles y es posible un desglose parcial, pero falta información clave o es muy ambigua para muchas transacciones.
    - "Error Parsing": Si el texto es ilegible, corrupto, no es CSV o claramente no son datos financieros.
    - "No Data Identified": Si no se encuentran transacciones financieras en el texto a pesar de ser un CSV legible.
- Para 'feedback': Proporciona un resumen textual conciso en español. Ej., "Extracto de '{{originalFileName}}' analizado correctamente. Se identificó un ingreso total de X y gastos totales de Y en moneda ZZZ. El desglose detallado por proveedor está disponible." o "No se pudo extraer información detallada de proveedores de '{{originalFileName}}' debido a descripciones de transacciones inconsistentes."

Tu salida DEBE ser un objeto JSON válido que coincida con BankStatementSummarySchema.
`,
});

// Función exportada para ser llamada por el componente de frontend
export async function analyzeBankStatement(input: AnalyzeBankStatementInput): Promise<BankStatementSummary> {
  return analyzeBankStatementFlow(input);
}

// Definir el flujo de Genkit
const analyzeBankStatementFlow = ai.defineFlow(
  {
    name: 'analyzeBankStatementFlow_es', // Nombre del flujo, opcionalmente con sufijo _es
    inputSchema: AnalyzeBankStatementDataUriInputSchema,
    outputSchema: BankStatementSummarySchema, // Usa el esquema de salida actualizado
  },
  async (input): Promise<BankStatementSummary> => {
    let statementTextContent: string;
    let promptPayload: z.infer<typeof PromptInputSchema>;

    try {
      // Esperando data:text/csv;base64,... o similar tipo MIME de texto
      const dataUriParts = input.statementDataUri.match(/^data:(text\/.+);base64,(.+)$/);
      if (!dataUriParts) {
        console.warn("Data URI recibido que no está basado en texto:", input.statementDataUri.substring(0, 100));
        return {
          status: "Error Parsing",
          feedback: `Formato de Data URI inválido. Se esperaba un Data URI basado en texto (ej., text/csv). Archivo original: ${input.originalFileName || 'desconocido'}.`,
        };
      }

      const mimeType = dataUriParts[1];
      if (!mimeType.startsWith('text/')) {
           console.warn("Data URI recibido con tipo MIME no textual después del procesamiento del cliente:", mimeType);
           return {
             status: "Error Parsing",
             feedback: `Data URI no textual recibido (tipo MIME: ${mimeType}) después del procesamiento en el lado del cliente. Se esperaba text/csv. Archivo original: ${input.originalFileName || 'desconocido'}.`,
           };
      }

      const base64Data = dataUriParts[2];
      try {
        statementTextContent = Buffer.from(base64Data, 'base64').toString('utf-8');
      } catch (bufferError: any) {
        console.error("Error al decodificar datos Base64 en el flujo:", bufferError);
        return {
          status: "Error Parsing",
          feedback: `Falló la decodificación del contenido Base64 del archivo '${input.originalFileName || 'desconocido'}'. Los datos del archivo podrían estar corruptos o no codificados correctamente.`,
        };
      }
      
      if (!statementTextContent.trim()) {
        return {
          status: "No Data Identified",
          feedback: `El archivo '${input.originalFileName || 'desconocido'}' fue procesado, pero no se pudo extraer contenido textual o estaba vacío.`,
        };
      }
      promptPayload = { statementTextContent, originalFileName: input.originalFileName };

    } catch (e: any) {
      console.error("Error al procesar datos del archivo en el flujo:", e);
      return {
        status: "Error Parsing",
        feedback: `Falló el procesamiento de los datos del archivo para '${input.originalFileName || 'desconocido'}': ${e.message || 'Error desconocido durante el procesamiento del archivo.'}`,
      };
    }

    // Llamar al prompt con la carga útil preparada
    // Asegúrate de que el LLM que estás usando (ej. gemini-2.0-flash, gemini-pro) es capaz de manejar esta complejidad de prompt y de salida JSON.
    // Modelos más avanzados (ej. Gemini 1.5 Pro) suelen ser mejores para tareas complejas de extracción y estructuración.
    const { output } = await analysisPrompt(promptPayload);

    if (!output) {
      // Fallback si el LLM falla en producir una salida estructurada.
      return {
        status: "Error Parsing", // O un estado más específico como "Error IA"
        feedback: `El modelo IA no pudo generar una respuesta estructurada para el contenido de '${input.originalFileName || 'desconocido'}'. Esto podría deberse a un error interno de la IA o a datos muy inusuales.`,
      };
    }
    return output;
  }
);
