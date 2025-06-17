// src/app/api/investmentSavingsFlow/route.ts
import { investmentSavingsFlow } from '@/ai/flows/investment-flow';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(investmentSavingsFlow);