
'use server';
/**
 * @fileOverview Analyzes bank statement files. If CSV, extracts text for analysis.
 * If Excel, informs user about conversion to CSV for analysis.
 *
 * - analyzeBankStatement - A function that processes a bank statement file content.
 * - AnalyzeBankStatementInput - The input type for the analyzeBankStatement function.
 * - BankStatementSummary - The return type (summary) for the analyzeBankStatement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the exported function - accepts Data URI of the file
const AnalyzeBankStatementDataUriInputSchema = z.object({
  statementDataUri: z
    .string()
    .describe(
      "A bank statement file as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  originalFileName: z.string().optional().describe("Original name of the uploaded file for context."),
});
export type AnalyzeBankStatementInput = z.infer<typeof AnalyzeBankStatementDataUriInputSchema>;


// Schema for the output (summary) of the analysis flow
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified", "Unsupported File Type"])
    .describe("Status of the analysis based on the provided file content."),
  feedback: z.string().describe("A brief textual summary or feedback on the analysis. This could include total income/expenses if identifiable, or notes on parsing/conversion requirements."),
});
export type BankStatementSummary = z.infer<typeof BankStatementSummarySchema>;


// Internal schema for the prompt - can receive CSV text or an indicator for Excel
const PromptInputSchema = z.object({
  statementTextContent: z.string().optional().describe('The textual content of the bank statement (e.g., CSV data). Present if the original file was CSV.'),
  isExcelFile: z.boolean().optional().describe('True if the original file was an Excel file. statementTextContent will be absent in this case.'),
  originalFileName: z.string().optional().describe('Original name of the uploaded file for context.'),
});


// Define the Genkit prompt
const analysisPrompt = ai.definePrompt({
  name: 'analyzeBankStatementPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: BankStatementSummarySchema },
  prompt: `You are a financial data analyst AI.
Your task is to analyze the provided bank statement information or guide the user if the format is not directly processable.
Original file name for context: {{#if originalFileName}}{{originalFileName}}{{else}}Not provided{{/if}}

{{#if isExcelFile}}
The user uploaded an Excel file named '{{originalFileName}}'. 
Direct analysis of Excel file content is not supported in this step. 
Please set the status to "Unsupported File Type" and for feedback, instruct the user to convert this Excel file to CSV format and upload it again for analysis.
{{else}}
  {{#if statementTextContent}}
Statement text content (from CSV) to analyze:
\`\`\`
{{{statementTextContent}}}
\`\`\`
Based on your analysis of this CSV text:
- For 'status': Use "Success" if you can meaningfully parse financial data, "Partial Data" if some is understandable but key info is missing, "Error Parsing" if unreadable or seems unrelated to financial data, "No Data Identified" if no financial transactions are found.
- For 'feedback': Provide a concise textual summary. E.g., "Successfully analyzed statement. Identified X income transactions and Y expense transactions." or "The provided text does not appear to contain typical bank statement transactions." Mention high-level insights if possible. Do not invent data.
  {{else}}
The file '{{originalFileName}}' was either empty after attempting to read its text content, or it was not a CSV or recognized Excel file. 
Please set 'status' to "Error Parsing" or "No Data Identified" and provide appropriate feedback.
  {{/if}}
{{/if}}

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
    let promptPayload: z.infer<typeof PromptInputSchema>;

    try {
      const dataUriParts = input.statementDataUri.match(/^data:(.+?);base64,(.+)$/);
      if (!dataUriParts) {
        console.warn("Received Data URI that is not in the expected format:", input.statementDataUri.substring(0, 100));
        return {
          status: "Error Parsing",
          feedback: `Invalid Data URI format. Original file: ${input.originalFileName || 'unknown'}.`,
        };
      }

      const mimeType = dataUriParts[1];
      const base64Data = dataUriParts[2];
      
      if (mimeType.startsWith('text/csv')) {
        const fileBuffer = Buffer.from(base64Data, 'base64');
        const statementTextContent = fileBuffer.toString('utf-8');

        if (!statementTextContent.trim()) {
          promptPayload = { originalFileName: input.originalFileName }; // Let LLM decide status for empty CSV
        } else {
          promptPayload = { statementTextContent, originalFileName: input.originalFileName };
        }
      } else if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // It's an Excel file. We won't parse content here. LLM will instruct user.
        promptPayload = { isExcelFile: true, originalFileName: input.originalFileName };
      } else {
        // Other unsupported file types
        console.warn("Unsupported MIME type in Data URI:", mimeType);
        return {
          status: "Unsupported File Type",
          feedback: `The file type '${mimeType}' from '${input.originalFileName || 'unknown'}' is not supported. Please upload a CSV or Excel file.`,
        };
      }

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
      return {
        status: "Error Parsing",
        feedback: `The AI model could not generate a response for the content from '${input.originalFileName || 'unknown'}'. Please try again or use a different file.`,
      };
    }
    return output;
  }
);
