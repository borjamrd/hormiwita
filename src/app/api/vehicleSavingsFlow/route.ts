// src/app/api/vehicleSavingsFlow/route.ts
import { vehicleSavingsFlow } from "@/ai/flows/vehicle-savings-flow";
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(vehicleSavingsFlow);