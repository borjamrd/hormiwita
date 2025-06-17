// src/components/action-plan/ObjectiveModuleLoader.tsx
"use client";

import { VehicleSavingsModule } from "./modules/VehicleSavingsModule";

interface Props {
  flowIdentifier: string;
  onComplete: () => void;
}

export function ObjectiveModuleLoader({ flowIdentifier, onComplete }: Props) {
  switch (flowIdentifier) {
    case "vehicleSavingsFlow":
      return <VehicleSavingsModule onComplete={onComplete} />;

    // Aquí añadiríamos más 'case' para otros módulos en el futuro
    // case 'investmentSavingsFlow':
    //   return <InvestmentSavingsModule onComplete={onComplete} />;

    default:
      return (
        <div className="p-4 bg-destructive text-destructive-foreground rounded-md">
          <p>
            Error: No se encontró un módulo para el objetivo con identificador:
            '{flowIdentifier}'.
          </p>
          <button onClick={onComplete} className="mt-2 underline">
            Volver al plan
          </button>
        </div>
      );
  }
}
