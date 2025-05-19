
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

// Schema for the input of the exported flow function
const FlowInputSchema = z.object({
  statementDataUri: z
    .string()
    .describe(
      "A bank statement file (CSV or Excel) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeBankStatementInput = z.infer<typeof FlowInputSchema>;

// Schema for the output (summary) of the analysis flow
const BankStatementSummarySchema = z.object({
  status: z.enum(["Success", "Partial Data", "Error Parsing", "No Data Identified", "Unsupported Format"])
    .describe("Status of the analysis based on the provided file."),
  feedback: z.string().describe("A brief textual summary or feedback on the analysis. This could include total income/expenses if identifiable, or notes on parsing/support."),
});
export type BankStatementSummary = z.infer<typeof BankStatementSummarySchema>;

// Schema for the input of the Genkit prompt (internal)
const PromptInputSchema = z.object({
    csvData: z.object({ statementTextContent: z.string() }).optional().describe("The textual content of the bank statement if it's a CSV file."),
    excelUnsupportedMarker: z.object({}).optional().describe("A marker object indicating an Excel file was provided, which is currently unsupported for direct content analysis."),
    otherUnsupportedMarker: z.object({ errorMessage: z.string().optional() }).optional().describe("A marker object for other unsupported file types or pre-processing errors.")
});


// Exported function to be called by the frontend component
export async function analyzeBankStatement(input: AnalyzeBankStatementInput): Promise<BankStatementSummary> {
  return analyzeBankStatementFlow(input);
}

// Define the Genkit prompt for analyzing bank statements
const analysisPrompt = ai.definePrompt({
  name: 'analyzeBankStatementPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: BankStatementSummarySchema },
  prompt: `You are a financial data analyst AI.

{{#if csvData}}
Your task is to analyze the provided bank statement data which is in CSV text format.
Focus on identifying overall income, expenses, and general transaction patterns from the CSV data below.

CSV Data:
{{{csvData.statementTextContent}}}

Based on your analysis, provide a structured JSON response conforming to the BankStatementSummarySchema.
- For 'status':
  - Use "Success" if you can meaningfully parse the data and provide some insights.
  - Use "Partial Data" if some data is understandable but key information is missing or ambiguous.
  - Use "Error Parsing" if the CSV data is unreadable or malformed.
  - Use "No Data Identified" if the CSV is parsed but contains no financial transaction data.
- For 'feedback': Provide a concise textual summary. For example, "Successfully analyzed statement. Identified X income transactions and Y expense transactions." or "Could not parse the CSV data."
  If possible, mention very high-level insights. Do not invent data if not present.

{{else}}{{#if excelUnsupportedMarker}}
The user attempted to upload an Excel (.xlsx or .xls) file. This system cannot directly process Excel files in this version due to limitations.
Please generate a response with:
- 'status': "Unsupported Format"
- 'feedback': "Excel file analysis is not supported in this version. Please convert your file to CSV format and try uploading again."

{{else}}{{#if otherUnsupportedMarker}}
The user attempted to upload an unsupported file type, or the file data was not recognized or could not be pre-processed.
{{#if otherUnsupportedMarker.errorMessage}}
Details: {{otherUnsupportedMarker.errorMessage}}
{{/if}}
Please generate a response with:
- 'status': "Unsupported Format"
- 'feedback': "The uploaded file type is not supported or could not be processed. Please upload a CSV file."
{{else}}
{{! This block should ideally not be reached if the pre-processing logic is correct }}
An unexpected file processing scenario occurred. The file type could not be determined, or no specific handling was applied.
Please generate a response with:
- 'status': "Error Parsing"
- 'feedback': "Could not determine the file type for analysis or an internal error occurred during pre-processing."
{{/if}}{{/if}}{{/if}}

Your output MUST be a valid JSON object matching the BankStatementSummarySchema.
`,
});

// Define the Genkit flow
const analyzeBankStatementFlow = ai.defineFlow(
  {
    name: 'analyzeBankStatementFlow',
    inputSchema: FlowInputSchema, // External input is still the Data URI
    outputSchema: BankStatementSummarySchema,
  },
  async (flowInput) => {
    const { statementDataUri } = flowInput;
    let promptPayload: z.infer<typeof PromptInputSchema>;

    try {
      const parts = statementDataUri.match(/^data:(.+);base64,(.+)$/);
      if (!parts || parts.length < 3) {
        throw new Error("Invalid Data URI format. Could not extract MIME type or Base64 data.");
      }
      const mimeType = parts[1];
      const base64Data = parts[2];

      if (mimeType === 'text/csv') {
        const csvText = Buffer.from(base64Data, 'base64').toString('utf-8');
        promptPayload = { csvData: { statementTextContent: csvText } };
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'application/vnd.ms-excel') {
        promptPayload = { excelUnsupportedMarker: {} };
      } else {
        // For any other MIME type not explicitly handled
        promptPayload = { otherUnsupportedMarker: { errorMessage: `Unsupported MIME type: ${mimeType}` } };
      }
    } catch (error) {
      console.error("Error pre-processing bank statement URI:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during file pre-processing.";
      promptPayload = { otherUnsupportedMarker: { errorMessage } };
    }

    // Call the prompt with the prepared payload
    const { output } = await analysisPrompt(promptPayload);

    if (!output) {
      // Fallback if LLM fails.
      let fallbackStatus: BankStatementSummary['status'] = "Error Parsing";
      let fallbackFeedback = "The AI model could not generate a response.";

      if (promptPayload.excelUnsupportedMarker) {
        fallbackStatus = "Unsupported Format";
        fallbackFeedback = "Excel file analysis is not supported. Please convert to CSV.";
      } else if (promptPayload.otherUnsupportedMarker) {
        fallbackStatus = "Unsupported Format";
        fallbackFeedback = `Unsupported file type or pre-processing error: ${promptPayload.otherUnsupportedMarker.errorMessage || "Please use CSV."}`;
      } // If it was csvData and LLM failed, "Error Parsing" is a reasonable default.

      return {
        status: fallbackStatus,
        feedback: fallbackFeedback,
      };
    }
    return output;
  }
);

