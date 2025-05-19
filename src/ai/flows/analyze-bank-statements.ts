
'use server';
/**
 * @fileOverview Analyzes bank statement files (CSV) to provide a financial summary.
 * Excel files are identified as unsupported for direct content analysis.
 *
 * - analyzeBankStatement - A function that processes a bank statement file.
 * - AnalyzeBankStatementInput - The input type for the analyzeBankStatement function.
 * - BankStatementSummary - The return type (summary) for the analyzeBankStatement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the exported function - still accepts Data URI
const AnalyzeBankStatementDataUriInputSchema = z.object({
  statementDataUri: z
    .string()
    .describe(
      "A bank statement file (CSV or Excel) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  originalFileName: z.string().optional().describe("Original name of the uploaded file."),
});
export type AnalyzeBankStatementInput = z.infer<typeof AnalyzeBankStatementDataUriInputSchema>;

// Schema for the output (summary) of the analysis flow
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified", "Unsupported File Type"])
    .describe("Status of the analysis based on the provided file."),
  feedback: z.string().describe("A brief textual summary or feedback on the analysis. This could include total income/expenses if identifiable, or notes on parsing."),
});
export type BankStatementSummary = z.infer<typeof BankStatementSummarySchema>;

// Internal schema for the prompt - differentiates input types
const PromptInputSchema = z.object({
  csvData: z.object({
    statementTextContent: z.string().describe('The textual content of the CSV bank statement.'),
    originalFileName: z.string().optional(),
  }).optional(),
  excelMarker: z.object({ // Marker for Excel files, content not processed here
    originalFileName: z.string().optional(),
  }).optional(),
  otherUnsupportedMarker: z.object({
    originalFileName: z.string().optional(),
    mimeType: z.string().optional(),
  }).optional(),
});


// Define the Genkit prompt
const analysisPrompt = ai.definePrompt({
  name: 'analyzeBankStatementPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: BankStatementSummarySchema },
  prompt: `You are a financial data analyst AI.
Your output MUST be a valid JSON object matching the BankStatementSummarySchema.

{{#if csvData}}
Your task is to analyze the provided bank statement text content from a CSV file.
Original file name for context: {{csvData.originalFileName}}
Focus on identifying overall income, expenses, and general transaction patterns.

Statement text content to analyze:
\`\`\`
{{{csvData.statementTextContent}}}
\`\`\`

Based on your analysis:
- For 'status': Use "Success" if you can meaningfully parse, "Partial Data" if some is understandable but key info is missing, "Error Parsing" if unreadable, "No Data Identified" if no financial data.
- For 'feedback': Provide a concise textual summary. E.g., "Successfully analyzed statement. Identified X income transactions and Y expense transactions." or "The provided text does not appear to be a bank statement." Mention high-level insights if possible. Do not invent data.
{{else if excelMarker}}
The user attempted to upload an Excel file named '{{excelMarker.originalFileName}}' for bank statement analysis.
Direct parsing of Excel file content is not currently supported.
Please set 'status' to "Unsupported File Type".
For 'feedback', inform the user that Excel files are not directly supported for analysis at this moment and suggest they convert the file to CSV format and try again.
{{else if otherUnsupportedMarker}}
The user attempted to upload a file named '{{otherUnsupportedMarker.originalFileName}}' with an unsupported MIME type '{{otherUnsupportedMarker.mimeType}}'.
This file type is not supported for analysis.
Please set 'status' to "Unsupported File Type".
For 'feedback', inform the user that this file type is not supported and they should upload a CSV or Excel file (though Excel will also be marked as unsupported for content analysis).
{{else}}
No specific data type marker was provided. This is an unexpected state.
Please set 'status' to "Error Parsing".
For 'feedback', state that there was an issue understanding the input file type.
{{/if}}
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
    let detectedMimeType = '';
    let promptPayload: z.infer<typeof PromptInputSchema>;

    try {
      const dataUriParts = input.statementDataUri.match(/^data:(.+);base64,(.+)$/);
      if (!dataUriParts) {
        return {
          status: "Error Parsing",
          feedback: "Invalid Data URI format.",
        };
      }

      detectedMimeType = dataUriParts[1];
      const base64Data = dataUriParts[2];
      const fileBuffer = Buffer.from(base64Data, 'base64');

      if (detectedMimeType === 'text/csv') {
        const statementTextContent = fileBuffer.toString('utf-8');
        if (!statementTextContent.trim()) {
          return {
            status: "No Data Identified",
            feedback: "The CSV file was processed, but no text content could be extracted or it was empty.",
          };
        }
        promptPayload = { csvData: { statementTextContent, originalFileName: input.originalFileName } };
      } else if (
        detectedMimeType === 'application/vnd.ms-excel' || // .xls
        detectedMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
      ) {
        // Excel files are not parsed for content here. We send a marker to the LLM.
        promptPayload = { excelMarker: { originalFileName: input.originalFileName } };
      } else {
        // Other unsupported file types
        promptPayload = { otherUnsupportedMarker: { originalFileName: input.originalFileName, mimeType: detectedMimeType } };
      }
    } catch (e: any) {
      console.error("Error processing file data:", e);
      return {
        status: "Error Parsing",
        feedback: `Failed to process the file: ${e.message || 'Unknown error during file processing.'}`,
      };
    }

    // Call the prompt with the prepared payload
    const { output } = await analysisPrompt(promptPayload);

    if (!output) {
      // Fallback if LLM fails to produce structured output.
      return {
        status: "Error Parsing",
        feedback: "The AI model could not generate a response for the provided file content. Please try again or use a different file.",
      };
    }
    return output;
  }
);
