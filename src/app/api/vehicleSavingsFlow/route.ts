// src/app/api/vehicleSavingsFlow/route.ts
import { vehicleSavingsFlow } from "@/ai/flows/vehicle-savings-flow";
import { appRoute } from '@genkit-ai/next';

// Esto expone tu flujo en la URL /api/vehicleSavingsFlow
export const POST = appRoute(vehicleSavingsFlow);