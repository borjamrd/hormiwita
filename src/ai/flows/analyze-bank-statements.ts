
'use server';
/**
 * @fileOverview Analyzes bank statement files (CSV or Excel converted to CSV text)
 * to provide a financial summary.
 *
 * - analyzeBankStatement - A function that processes a bank statement file content.
 * - AnalyzeBankStatementInput - The input type for the analyzeBankStatement function.
 * - BankStatementSummary - The return type (summary) for the analyzeBankStatement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the exported function - accepts Data URI of (CSV or Excel-converted-to-CSV) text
const AnalyzeBankStatementDataUriInputSchema = z.object({
  statementDataUri: z
    .string()
    .describe(
      "A bank statement file's content (CSV text, or Excel converted to CSV text) as a data URI. Expected format: 'data:text/csv;base64,<encoded_data>' or similar text type."
    ),
  originalFileName: z.string().optional().describe("Original name of the uploaded file for context."),
});
export type AnalyzeBankStatementInput = z.infer<typeof AnalyzeBankStatementDataUriInputSchema>;

// Schema for the output (summary) of the analysis flow
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified", "Unsupported File Type"])
    .describe("Status of the analysis based on the provided file content."),
  feedback: z.string().describe("A brief textual summary or feedback on the analysis. This could include total income/expenses if identifiable, or notes on parsing."),
});
export type BankStatementSummary = z.infer<typeof BankStatementSummarySchema>;

// Internal schema for the prompt - expects textual content
const PromptInputSchema = z.object({
  statementTextContent: z.string().describe('The textual content of the bank statement (e.g., CSV data).'),
  originalFileName: z.string().optional().describe('Original name of the uploaded file for context.'),
});


// Define the Genkit prompt
const analysisPrompt = ai.definePrompt({
  name: 'analyzeBankStatementPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: BankStatementSummarySchema },
  prompt: `You are a financial data analyst AI.
Your task is to analyze the provided bank statement text content.
Original file name for context (if available): {{#if originalFileName}}{{originalFileName}}{{else}}Not provided{{/if}}
Focus on identifying overall income, expenses, and general transaction patterns from the text.

Statement text content to analyze:
\`\`\`
{{{statementTextContent}}}
\`\`\`

Based on your analysis:
- For 'status': Use "Success" if you can meaningfully parse financial data, "Partial Data" if some is understandable but key info is missing, "Error Parsing" if unreadable or seems unrelated to financial data, "No Data Identified" if no financial transactions are found in the text.
- For 'feedback': Provide a concise textual summary. E.g., "Successfully analyzed statement. Identified X income transactions and Y expense transactions." or "The provided text does not appear to contain typical bank statement transactions." Mention high-level insights if possible. Do not invent data.

Your output MUST be a valid JSON object matching the BankStatementSummarySchema.
`,
});

// Exported function to be called by the frontend component
export async function analyzeBankStatement(input: AnalyzeBankStatementInput): Promise<BankStatementSummary> {
  return analyzeBankStatementFlow(input);
}

// Define the Genkit flow
const analyzeBankStatementFlow = ai.defineFlow(
  {
    name: 'analyzeBankStatementFlow',
    inputSchema: AnalyzeBankStatementDataUriInputSchema,
    outputSchema: BankStatementSummarySchema,
  },
  async (input): Promise<BankStatementSummary> => {
    let statementTextContent: string;
    let promptPayload: z.infer<typeof PromptInputSchema>;

    try {
      const dataUriParts = input.statementDataUri.match(/^data:(text\/.+);base64,(.+)$/);
      if (!dataUriParts) {
        // This case should ideally be caught by client-side validation if it always sends text
        console.warn("Received Data URI that is not text based:", input.statementDataUri.substring(0, 100));
        return {
          status: "Error Parsing",
          feedback: `Invalid Data URI format. Expected a text-based Data URI (e.g., text/csv). Original file: ${input.originalFileName || 'unknown'}.`,
        };
      }

      const base64Data = dataUriParts[2];
      const fileBuffer = Buffer.from(base64Data, 'base64');
      statementTextContent = fileBuffer.toString('utf-8');

      if (!statementTextContent.trim()) {
        return {
          status: "No Data Identified",
          feedback: `The file '${input.originalFileName || 'unknown'}' was processed, but no text content could be extracted or it was empty.`,
        };
      }
      promptPayload = { statementTextContent, originalFileName: input.originalFileName };

    } catch (e: any) {
      console.error("Error processing file data in flow:", e);
      return {
        status: "Error Parsing",
        feedback: `Failed to process the file data for '${input.originalFileName || 'unknown'}': ${e.message || 'Unknown error during file processing.'}`,
      };
    }

    // Call the prompt with the prepared payload
    const { output } = await analysisPrompt(promptPayload);

    if (!output) {
      // Fallback if LLM fails to produce structured output.
      return {
        status: "Error Parsing",
        feedback: `The AI model could not generate a response for the content from '${input.originalFileName || 'unknown'}'. Please try again or use a different file.`,
      };
    }
    return output;
  }
);
