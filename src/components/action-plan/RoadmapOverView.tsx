// src/components/action-plan/RoadmapOverview.tsx
'use client';

import { Card } from "@/components/ui/card";
import type { Roadmap } from "@/store/userStore";
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface RoadmapOverviewProps {
  roadmap: Roadmap;
}

export function RoadmapOverview({ roadmap }: RoadmapOverviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="p-6 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700">
        <p className="text-lg font-medium">{roadmap.introduction}</p>
      </div>

      <div className="space-y-3">
          <h3 className="text-xl font-semibold px-1">Tus próximos pasos:</h3>
          {roadmap.steps.map((step, index) => (
            <Card 
              key={index} 
              className="flex items-center p-4 transition-all"
              data-status={step.status}
            >
              <div className="flex-shrink-0 mr-4">
                {step.status === 'in_progress' && <Loader2 className="h-6 w-6 text-primary animate-spin" />}
                {step.status === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                {step.status === 'pending' && <Circle className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-md">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </Card>
        ))}
      </div>
    </div>
  );
}