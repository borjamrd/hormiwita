// src/components/action-plan.tsx
'use client';

import { useEffect, useState } from 'react';
import useUserStore from '@/store/userStore';
import { Loader2, Terminal } from 'lucide-react';
import { ObjectiveModuleLoader } from './action-plan/ObjectiveModuleLoader';
import { RoadmapOverview } from './action-plan/RoadmapOverView';
import { Roadmap } from '@/store/userStore';

// 1. Importamos la función correcta desde el cliente de Next.js
import { runFlow } from '@genkit-ai/next/client';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


export function ActionPlan() {
  const { userData, setRoadmap, updateRoadmapStepStatus } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeObjective, setActiveObjective] = useState<Roadmap['steps'][0] | null>(null);
    const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchRoadmap = async () => {
      // Si ya tenemos un roadmap o nos faltan datos, no hacemos nada.
      if (userData?.roadmap || !userData?.name || !userData?.specificObjectives?.length) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null); 

      try {
    
        const roadmapResult = await runFlow({
          url: '/api/generateObjectivesRoadmap',
          input: {
            name: userData.name,
            specificObjectives: userData.specificObjectives,
          },
        });

        // 2. Validamos que la respuesta de la API tiene la estructura esperada
        if (roadmapResult && roadmapResult) {
          setRoadmap(roadmapResult);
        } else {
          console.error("La respuesta de la API no es un roadmap válido:", roadmapResult);
          throw new Error("La respuesta del servidor no tiene el formato esperado.");
        }

      } catch (err: any) {
        console.error("Error al generar el roadmap:", err);
        setError(err.message || "No se pudo cargar el plan de acción. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmap();
  }, [userData?.name, userData?.specificObjectives, userData?.roadmap, setRoadmap]);
  
  useEffect(() => {
    if (userData?.roadmap && !activeObjective) {
      const nextObjective = userData.roadmap.steps.find(step => step.status === 'pending');
      if (nextObjective) {
        updateRoadmapStepStatus(nextObjective.objective, 'in_progress');
        setActiveObjective(nextObjective);
      }
    }
  }, [userData?.roadmap, activeObjective, updateRoadmapStepStatus]);

  const handleObjectiveComplete = () => {
    if (activeObjective) {
      updateRoadmapStepStatus(activeObjective.objective, 'completed');
      setActiveObjective(null);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 rounded-lg bg-card p-4">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="ml-4 text-lg">Hormi está creando tu plan personalizado...</p>
      </div>
    );
  }
  
  if (activeObjective) {
    return (
      <ObjectiveModuleLoader 
        flowIdentifier={activeObjective.flowIdentifier}
        onComplete={handleObjectiveComplete}
      />
    );
  }

   if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error al generar el plan</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (userData?.roadmap) {
    const allCompleted = userData.roadmap.steps.every(step => step.status === 'completed');
    if (allCompleted) {
        return (
            <div className="p-6 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">¡Felicidades!</h2>
                <p className="mt-2 text-green-700 dark:text-green-300">Has completado todos los pasos de tu plan.</p>
            </div>
        )
    }
    return <RoadmapOverview roadmap={userData.roadmap} />;
  }

  return null;
}