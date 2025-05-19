
'use server';
/**
 * @fileOverview Analyzes bank statement files (CSV/Excel) to provide a financial summary.
 *
 * - analyzeBankStatement - A function that processes a bank statement file.
 * - AnalyzeBankStatementInput - The input type for the analyzeBankStatement function.
 * - BankStatementSummary - The return type (summary) for the analyzeBankStatement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for the input of the analysis flow (NOT EXPORTED)
const AnalyzeBankStatementInputSchema = z.object({
  statementDataUri: z
    .string()
    .describe(
      "A bank statement file (CSV or Excel) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeBankStatementInput = z.infer<typeof AnalyzeBankStatementInputSchema>;

// Schema for the output (summary) of the analysis flow (NOT EXPORTED)
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified"])
    .describe("Status of the analysis based on the provided file."),
  feedback: z.string().describe("A brief textual summary or feedback on the analysis. This could include total income/expenses if identifiable, or notes on parsing."),
  // Future detailed fields:
  // totalIncome: z.number().optional().describe("Total income identified, if available."),
  // totalExpenses: z.number().optional().describe("Total expenses identified, if available."),
  // topExpenseCategories: z.array(z.string()).optional().describe("Identified top expense categories, if available.")
});
export type BankStatementSummary = z.infer<typeof BankStatementSummarySchema>;

// Exported function to be called by the frontend component
export async function analyzeBankStatement(input: AnalyzeBankStatementInput): Promise<BankStatementSummary> {
  return analyzeBankStatementFlow(input);
}

// Define the Genkit prompt for analyzing bank statements
const analysisPrompt = ai.definePrompt({
  name: 'analyzeBankStatementPrompt',
  input: { schema: AnalyzeBankStatementInputSchema },
  output: { schema: BankStatementSummarySchema },
  prompt: `You are a financial data analyst AI. Your task is to analyze the provided bank statement file.
The file is in CSV or Excel format, encoded as a data URI.
Focus on identifying overall income, expenses, and general transaction patterns.

File to analyze: {{media url=statementDataUri}}

Based on your analysis, provide a structured JSON response conforming to the BankStatementSummarySchema.
- For 'status':
  - Use "Success" if you can meaningfully parse the data and provide some insights.
  - Use "Partial Data" if some data is understandable but key information is missing or ambiguous.
  - Use "Error Parsing" if the file is unreadable, malformed, or not a bank statement.
  - Use "No Data Identified" if the file is parsed but contains no financial transaction data.
- For 'feedback': Provide a concise textual summary. For example, "Successfully analyzed statement. Identified X income transactions and Y expense transactions." or "Could not parse the file, please ensure it's a valid CSV/Excel bank statement."
  If possible, mention very high-level insights like "significant spending in X category" or "consistent income source noted". Do not invent data if not present.

Prioritize accuracy and clearly state if data is insufficient or unparsable.
Your output MUST be a valid JSON object matching the schema.
`,
  // Potentially add safetySettings if dealing with very sensitive data patterns,
  // though Gemini's default safety should cover most general PII.
  // config: {
  //   safetySettings: [
  //     { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  //   ],
  // },
});

// Define the Genkit flow
const analyzeBankStatementFlow = ai.defineFlow(
  {
    name: 'analyzeBankStatementFlow',
    inputSchema: AnalyzeBankStatementInputSchema,
    outputSchema: BankStatementSummarySchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    if (!output) {
        // Fallback in case the LLM fails to produce structured output despite the prompt.
        return {
            status: "Error Parsing",
            feedback: "The AI model could not generate a response for the provided file. Please try again or use a different file.",
        };
    }
    return output;
  }
);
