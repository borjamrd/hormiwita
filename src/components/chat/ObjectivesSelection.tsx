
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const objectivesOptions = [
  "Fondo de emergencia",
  "Ahorro",
  "Reducción y gestión de deuda",
  "Reducción de gastos",
  "Aumentar ingresos"
];

interface ObjectivesSelectionProps {
  onObjectivesSubmit: (selectedObjectives: string[]) => void;
  isLoading: boolean;
}

export function ObjectivesSelection({ onObjectivesSubmit, isLoading }: ObjectivesSelectionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleObjective = (objective: string) => {
    setSelected(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(objective)) {
        newSelected.delete(objective);
      } else {
        newSelected.add(objective);
      }
      return newSelected;
    });
  };

  const handleSubmit = () => {
    if (selected.size > 0) {
      onObjectivesSubmit(Array.from(selected));
    }
  };

  return (
    <div className="flex flex-col gap-3 p-2 items-center w-full">
      <p className="text-sm text-foreground font-medium mb-1 text-center">
        Selecciona tus principales objetivos financieros:
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {objectivesOptions.map(objective => (
          <Button
            key={objective}
            variant={selected.has(objective) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleObjective(objective)}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 transition-all duration-150 ease-in-out",
              selected.has(objective) && "ring-2 ring-primary ring-offset-1"
            )}
            aria-pressed={selected.has(objective)}
          >
            {selected.has(objective) && <Check className="h-4 w-4" />}
            {objective}
          </Button>
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isLoading || selected.size === 0}
        className="mt-2 w-full sm:w-auto"
        aria-label="Confirmar objetivos seleccionados"
      >
        <Check className="mr-2 h-4 w-4" />
        Confirmar Objetivos
      </Button>
      {selected.size === 0 && (
         <p className="text-xs text-muted-foreground flex items-center mt-1">
            <CircleAlert className="h-3 w-3 mr-1"/> Debes seleccionar al menos un objetivo para continuar.
         </p>
      )}
    </div>
  );
}

    