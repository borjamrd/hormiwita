// src/app/api/generateObjectiveRoadmap/route.ts
import { generateObjectiveRoadmap } from '@/ai/flows/generate-objective-roadmap';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(generateObjectiveRoadmap);