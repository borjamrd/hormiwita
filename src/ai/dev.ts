
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-chat-response.ts';
import '@/ai/flows/summarize-chat-history.ts';
import '@/ai/flows/analyze-bank-statements.ts';
import '@/ai/flows/categorize-financial-data.ts'; // Added new flow
