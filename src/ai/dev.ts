
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-chat-response.ts';
import '@/ai/flows/summarize-chat-history.ts';
import '@/ai/flows/analyze-bank-statements.ts'; // Added new flow
