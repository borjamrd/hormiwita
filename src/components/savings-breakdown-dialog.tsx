// En tu archivo components/savings-breakdown-dialog.tsx
"use client";

import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Importa las interfaces necesarias de forecastUtils
import { SavingsScenario, ExpenseRemovedDetail } from "@/lib/forecastUtils";

// No necesitamos defaultSavingsDetails aquí, ya que los datos vienen de savingsDetails.
const savingsScenarioTitles: Record<
  keyof Omit<
    SavingsScenario,
    "simpleDetails" | "moderateDetails" | "maxDetails"
  >,
  string
> = {
  simple: "Ahorro Simple",
  moderate: "Ahorro Moderado",
  max: "Ahorro Máximo",
};

interface SavingsBreakdownDialogProps {
  children: ReactNode;
  savingsDetails: SavingsScenario | null; // Ahora contiene los detalles de gastos eliminados
}

export function SavingsBreakdownDialog({
  children,
  savingsDetails,
}: SavingsBreakdownDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Función para obtener los detalles de los gastos eliminados para un escenario dado
  const getExpensesRemovedForScenario = (
    scenario: keyof SavingsScenario
  ): ExpenseRemovedDetail[] => {
    if (!savingsDetails) return [];
    switch (scenario) {
      case "simple":
        return savingsDetails.simpleDetails;
      case "moderate":
        return savingsDetails.moderateDetails;
      case "max":
        return savingsDetails.maxDetails;
      default:
        return [];
    }
  };

  const getScenarioTotal = (scenario: keyof SavingsScenario): number => {
    if (!savingsDetails) return 0;
    switch (scenario) {
      case "simple":
        return savingsDetails.simple;
      case "moderate":
        return savingsDetails.moderate;
      case "max":
        return savingsDetails.max;
      default:
        return 0;
    }
  };

  const scenarioKeys: (keyof SavingsScenario)[] = ["simple", "moderate", "max"];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalle de Ahorro Potencial</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10">
            <TabsTrigger value="simple">Ahorro Simple</TabsTrigger>
            <TabsTrigger value="moderate">Ahorro Moderado</TabsTrigger>
            <TabsTrigger value="max">Ahorro Máximo</TabsTrigger>
          </TabsList>
          {scenarioKeys.map((key) => {
            const expensesRemoved = getExpensesRemovedForScenario(key);
            const totalSavings = getScenarioTotal(key);
            const title =
              savingsScenarioTitles[key as keyof typeof savingsScenarioTitles];

            return (
              <TabsContent key={key} value={key}>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-3">{title}</h3>
                  {expensesRemoved.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {expensesRemoved.map((item, index) => (
                        <li key={index} className="mb-1">
                          {item.description} (
                          {item.percentageRemoved
                            ? `${item.percentageRemoved}%`
                            : "Eliminado"}
                          ):{" "}
                          <span style={{ color: "#DB7072" }}>
                            -{formatCurrency(item.amountRemoved)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      No hay detalles de gastos eliminados para este tipo de
                      ahorro.
                    </p>
                  )}
                  {savingsDetails && (
                    <p className="mt-4 text-sm font-medium">
                      Total de ahorro mensual estimado:{" "}
                      <span style={{ color: "#14B4E7" }}>
                        {formatCurrency(totalSavings)}
                      </span>
                    </p>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
