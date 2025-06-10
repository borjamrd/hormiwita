// En tu archivo components/forecast-posible.tsx
"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button"; // ¡Asegúrate de importar Button!

// --- Importa el componente del diálogo de ahorro ---
import { SavingsBreakdownDialog } from "@/components/savings-breakdown-dialog";

// --- Lógica de datos dinámicos ---
import useUserStore from "@/store/userStore";
import {
  generateForecastData,
  calculateMonthlySavings,
  SavingsScenario,
} from "@/lib/forecastUtils";

const chartConfig = {
  ahorroSimple: {
    label: "Ahorro Simple",
    color: "hsl(var(--chart-1))",
  },
  ahorroModerado: {
    label: "Ahorro Moderado",
    color: "hsl(var(--chart-2))",
  },
  ahorroMaximo: {
    label: "Ahorro Máximo",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function ForecastPosible() {
  const { userData } = useUserStore();

  const forecastData = React.useMemo(() => {
    if (!userData || !userData.expensesIncomeSummary) return [];
    return generateForecastData(userData);
  }, [userData]);

  const monthlySavingsBreakdown: SavingsScenario | null = React.useMemo(() => {
    if (!userData || !userData.expensesIncomeSummary) return null;
    return calculateMonthlySavings(userData);
  }, [userData]);

  if (forecastData.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-[150px] items-center justify-center">
          <p className="text-muted-foreground">
            No hay suficientes datos de gastos para generar una previsión.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="pt-0 relative">
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[150px] w-full"
          >
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="fillSimple" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-ahorroSimple)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-ahorroSimple)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillModerado" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-ahorroModerado)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-ahorroModerado)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillMaximo" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-ahorroMaximo)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-ahorroMaximo)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}€`}
              />
              <ChartTooltip
                cursor={true}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(label) => `Mes: ${label}`}
                    formatter={(value, name) => [
                      `${value}€`,
                      chartConfig[name as keyof typeof chartConfig].label,
                    ]}
                  />
                }
              />
              <Area
                dataKey="ahorroSimple"
                type="natural"
                fill="url(#fillSimple)"
                fillOpacity={0.4}
                stroke="var(--color-ahorroSimple)"
              />
              <Area
                dataKey="ahorroModerado"
                type="natural"
                fill="url(#fillModerado)"
                fillOpacity={0.4}
                stroke="var(--color-ahorroModerado)"
              />
              <Area
                dataKey="ahorroMaximo"
                type="natural"
                fill="url(#fillMaximo)"
                fillOpacity={0.4}
                stroke="var(--color-ahorroMaximo)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <div className="absolute top-3 left-3">
          <SavingsBreakdownDialog savingsDetails={monthlySavingsBreakdown}>
            <Button variant={"outline"} className="rounded-xl" size={"sm"}>
              Ver Detalle de Ahorro
            </Button>
          </SavingsBreakdownDialog>
        </div>
      </Card>
    </div>
  );
}
