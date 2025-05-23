"use client"

import { ArrowDownWideNarrow, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import useUserStore, { type CategorizedItem } from "@/store/userStore"; // Import the user store and types
import { useEffect, useState } from "react"

// Function to get top N expense categories
const getTopExpenseCategories = (expenseItems: CategorizedItem[] | null | undefined, topN: number = 5) => {
  if (!expenseItems || expenseItems.length === 0) {
    return [];
  }

  const expensesByCategory: { [category: string]: number } = {};

  expenseItems.forEach(item => {
    const category = item.suggestedCategory || "Otros Gastos";
    expensesByCategory[category] = (expensesByCategory[category] || 0) + item.totalAmount;
  });

  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a) // Sort descending by amount
    .slice(0, topN);

  return sortedCategories.map(([categoryName, totalAmount]) => ({
    category: categoryName,
    amount: totalAmount,
  }));
};

const chartConfig = {
  amount: { // 'amount' will be the dataKey for the bar
    label: "Gasto Total",
    color: "hsl(var(--chart-1))", // Using default chart-1 color (blueish)
    icon: TrendingDown,
  },
  // If you had multiple bars per category, you'd define them here
  // For example, if comparing current vs previous month for each category:
  // currentMonth: { label: "Current Month", color: "hsl(var(--chart-1))" },
  // previousMonth: { label: "Previous Month", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function TopExpensesChart() {
  const storeUserData = useUserStore((state) => state.userData);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currency, setCurrency] = useState<string | undefined>("EUR");

  useEffect(() => {
    if (storeUserData?.expensesIncomeSummary?.categorizedExpenseItems) {
      const topExpenses = getTopExpenseCategories(storeUserData.expensesIncomeSummary.categorizedExpenseItems, 5);
      setChartData(topExpenses);
      setCurrency(storeUserData.expensesIncomeSummary.originalSummary?.detectedCurrency || "EUR");
    }
  }, [storeUserData]);

  if (!storeUserData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Principales Gastos por Categoría</CardTitle>
          <CardDescription>
            No hay datos de gastos suficientes para mostrar el gráfico.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-60">
          <p className="text-muted-foreground">Cargando datos o datos no disponibles...</p>
        </CardContent>
      </Card>
    );
  }
  
  const totalTopExpenses = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle  className="flex items-center gap-2">
            <ArrowDownWideNarrow className="h-6 w-6" />
            Principales Categorías de Gasto
        </CardTitle>
      
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical" // For horizontal bars, making category names more readable
            margin={{
              left: 10, // Increased left margin for category labels
              right:5,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3"/>
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tickFormatter={(value) => `${value.toLocaleString(undefined, {notation: 'compact', compactDisplay: 'short'})} ${currency}`}
            />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={300} // Adjust width as needed for category names
              // tickFormatter={(value) => value.length > 15 ? `${value.slice(0,15)}...` : value } // Optional: truncate long labels
            />
            <ChartTooltip
              cursor={false} // No cursor for bar chart is often cleaner
              content={<ChartTooltipContent indicator="dashed" hideLabel currency={currency}/>}
            />
             <Legend content={() => null} /> 
            <Bar 
              dataKey="amount" 
              fill="var(--color-amount)" 
              radius={4} 
              name="Gasto Total" // Name for tooltip
              barSize={20} // Adjust bar size as needed
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Suma de las principales categorías: {totalTopExpenses.toLocaleString(undefined, { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="leading-none text-muted-foreground">
          Basado en los datos de gastos categorizados.
        </div>
      </CardFooter>
    </Card>
  )
}
