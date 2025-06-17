"use client";

import type {
  BankStatementSummary,
} from "@/ai/flows/analyze-bank-statements";
import {
  categorizeFinancialData,
  type CategorizationInput,
  type CategorizedItem,
} from "@/ai/flows/categorize-financial-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ReferenceCategoriesDialog } from "./ReferenceCategoriesDialog";

interface RecordCategorizerProps {
  analysisResult: BankStatementSummary;
  onCategorizationComplete: (success: boolean) => void;
  onCategorizationDataUpdate: (data: {
    income: CategorizedItem[] | null;
    expenses: CategorizedItem[] | null;
  }) => void;
}

const expenseCategoriesDefault: Record<string, string[]> = {
  "Vivienda": [
    "Alquiler / Hipoteca",
    "Comunidad de Propietarios",
    "IBI (Impuesto sobre Bienes Inmuebles)",
    "Seguro del Hogar",
    "Reparaciones y Mantenimiento"
  ],
  "Suministros": [
    "Luz",
    "Agua",
    "Gas / Calefacción",
    "Internet",
    "Telefonía (Fija y Móvil)",
    "Plataformas de Streaming / TV de pago"
  ],
  "Alimentación": [
    "Supermercado y Comestibles",
    "Comida a Domicilio / Para Llevar"
  ],
  "Restaurantes y Ocio": [
    "Restaurantes y Cafés",
    "Bares y Copas",
    "Cine, Teatro, Conciertos",
    "Eventos Deportivos",
    "Libros, Música, Videojuegos",
    "Hobbies y Aficiones"
  ],
  "Transporte": [
    "Transporte Público",
    "Combustible",
    "Mantenimiento y Reparación de Vehículo",
    "Seguro de Vehículo",
    "Peajes y Aparcamiento",
    "Taxis / VTC"
  ],
  "Salud y Bienestar": [
    "Seguro Médico / Sanidad Privada",
    "Farmacia y Medicamentos",
    "Consultas Médicas y Especialistas",
    "Gimnasio / Actividades Deportivas"
  ],
  "Cuidado Personal": [
    "Peluquería y Estética",
    "Productos de Higiene y Cosmética"
  ],
  "Compras": [
    "Ropa y Calzado",
    "Tecnología y Electrónica",
    "Muebles y Decoración del Hogar",
    "Grandes Almacenes"
  ],
  "Educación": [
    "Matrículas y Tasas Académicas",
    "Libros y Material de Estudio",
    "Cursos y Formación"
  ],
  "Familia y Niños": [
    "Guardería / Cuidado Infantil",
    "Colegio",
    "Actividades Extraescolares",
    "Ropa y Artículos para Niños"
  ],
  "Finanzas": [
    "Pago de Préstamos",
    "Comisiones Bancarias",
    "Transferencias a Ahorro/Inversión",
    "Seguros (Vida, Decesos)"
  ],
  "Impuestos y Tasas": [
    "Declaración de la Renta (IRPF)",
    "Otros Impuestos"
  ],
  "Viajes y Vacaciones": [
    "Alojamientos",
    "Billetes de Transporte",
    "Actividades y Gastos en Destino"
  ],
  "Regalos y Donaciones": [
    "Regalos",
    "Donaciones a ONGs / Caridad"
  ],
  "Mascotas": [
    "Alimentación",
    "Veterinario y Cuidados Médicos",
    "Accesorios y Juguetes"
  ],
  "Trabajo / Negocio": [
    "Gastos de Oficina",
    "Software y Herramientas",
    "Viajes de Negocios"
  ],
  "Otros Gastos": ["Otros Gastos"]
};

const incomeCategoriesDefault: Record<string, string[]> = {
  "Nómina / Trabajo": [
    "Nómina / Salario",
    "Trabajo Autónomo / Freelance"
  ],
  "Prestaciones y Subsidios": [
    "Prestación por Desempleo",
    "Bajas por Enfermedad / Maternidad / Paternidad",
    "Ayudas Gubernamentales"
  ],
  "Pensiones": [
    "Pensión de Jubilación",
    "Pensión de Viudedad / Orfandad",
    "Pensión por Incapacidad"
  ],
  "Inversiones y Alquileres": [
    "Ingresos por Alquileres",
    "Ingresos por Inversiones: Intereses",
    "Ingresos por Inversiones: Dividendos de acciones",
    "Ingresos por Inversiones: Ganancias por venta de activos"
  ],
  "Regalos y Transferencias Recibidas": [
    "Regalos y Transferencias Recibidas",
    "Regalos y Transferencias Recibidas: Herencias"
  ],
  "Ventas y Reembolsos": [
    "Venta de artículos personales",
    "Reembolsos de compras o servicios",
    "Devoluciones de impuestos"
  ],
  "Otros Ingresos": [
    "Premios",
    "Colaboraciones esporádicas"
  ]
};

interface GroupedCategoryData {
  total: number;
  providers: CategorizedItem[];
}

const ProviderTable: React.FC<{
  title: string;
  data: any[] | undefined;
  currency: string | undefined;
}> = ({ title, data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-2">
        No hay datos de {title.toLowerCase()} por proveedor.
      </p>
    );
  }
  return (
    <div className="my-3">
      <h4 className="text-sm font-semibold mb-1.5 px-1">{title}</h4>
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="h-8">Proveedor</TableHead>
            <TableHead className="h-8 text-center">Nº Trans.</TableHead>
            <TableHead className="h-8 text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={`${item.providerName}-${index}`}>
              <TableCell className="py-1.5 font-medium truncate max-w-32 md:max-w-40">
                {item.providerName}
              </TableCell>
              <TableCell className="py-1.5 text-center">
                {item.transactionCount}
              </TableCell>
              <TableCell className="py-1.5 text-right">
                {item.totalAmount.toLocaleString(undefined, {
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {currency && (
                  <span className="ml-1 text-muted-foreground">{currency}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// This component is now also used by InfoPanel's modal, so ensure it's flexible enough or consider exporting it.
export const CategorizedAccordion: React.FC<{
  title: string;
  groupedData: Record<string, GroupedCategoryData>;
  currency: string | undefined;
}> = ({ title, groupedData, currency }) => {
  if (Object.keys(groupedData).length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-2">
        No hay datos categorizados para {title.toLowerCase()}.
      </p>
    );
  }
  const defaultOpenValue = Object.keys(groupedData)[0];
  return (
    <div className="my-3">
      <h4 className="text-sm font-semibold mb-1.5 px-1">{title}</h4>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpenValue}
        className="w-full"
      >
        {Object.entries(groupedData).map(([category, data]) => (
          <AccordionItem value={category} key={category} className="border-b">
            <AccordionTrigger className="text-xs hover:no-underline py-2 px-1 text-left">
              <div className="flex justify-between w-full items-center">
                <span className="font-medium truncate max-w-48 md:max-w-xs">
                  {category}
                </span>
                <span className="text-xs font-semibold ml-2 whitespace-nowrap">
                  {data.total.toLocaleString(undefined, {
                    style: "decimal",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {currency && (
                    <span className="ml-1 text-muted-foreground">
                      {currency}
                    </span>
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-1 pt-0">
              <Table className="text-xs my-1">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-7 py-1">Proveedor</TableHead>
                    <TableHead className="h-7 py-1 text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.providers.map((providerItem, idx) => (
                    <TableRow key={`${providerItem.providerName}-${idx}`}>
                      <TableCell className="py-1 truncate max-w-40 md:max-w-xs">
                        {providerItem.providerName}
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        {providerItem.totalAmount.toLocaleString(undefined, {
                          style: "decimal",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {currency && (
                          <span className="ml-1 text-muted-foreground text-xs">
                            {currency}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export function RecordCategorizer({
  analysisResult,
  onCategorizationComplete,
  onCategorizationDataUpdate,
}: RecordCategorizerProps) {
  const {
    incomeByProvider,
    expensesByProvider,
    totalIncome,
    totalExpenses,
    detectedCurrency,
    status,
  } = analysisResult;
  const { toast } = useToast();

  const [categorizedIncomeItems, setCategorizedIncomeItems] = useState<
    CategorizedItem[] | null
  >(null);
  const [categorizedExpenseItems, setCategorizedExpenseItems] = useState<
    CategorizedItem[] | null
  >(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
const [expenseCategories, setExpenseCategories] = useState(expenseCategoriesDefault);
const [incomeCategories, setIncomeCategories] = useState(incomeCategoriesDefault);

  useEffect(() => {
    setCategorizedIncomeItems(null);
    setCategorizedExpenseItems(null);
    onCategorizationComplete(false);
    onCategorizationDataUpdate({ income: null, expenses: null });
  }, [analysisResult, onCategorizationComplete, onCategorizationDataUpdate]);

  const groupAndSumByCategory = (
    items: CategorizedItem[] | null,
    itemType: "income" | "expense"
  ): Record<string, GroupedCategoryData> => {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const category =
        item.suggestedCategory ||
        (itemType === "income" ? "Otros Ingresos" : "Otros Gastos");
      if (!acc[category]) {
        acc[category] = { total: 0, providers: [] };
      }
      acc[category].total += item.totalAmount;
      acc[category].providers.push(item);
      return acc;
    }, {} as Record<string, GroupedCategoryData>);
  };

  const groupedCategorizedIncome = groupAndSumByCategory(
    categorizedIncomeItems,
    "income"
  );
  const groupedCategorizedExpenses = groupAndSumByCategory(
    categorizedExpenseItems,
    "expense"
  );

  const handleAutocategorize = async () => {
    if (!analysisResult) return;
    setIsCategorizing(true);
    onCategorizationComplete(false);

    let success = false;
    let finalIncomeItems: CategorizedItem[] = [];
    let finalExpenseItems: CategorizedItem[] = [];

    try {
      if (
        analysisResult.incomeByProvider &&
        analysisResult.incomeByProvider.length > 0
      ) {
        const incomeInput: CategorizationInput = {
          itemsToCategorize: analysisResult.incomeByProvider,
          itemType: "income",
          existingCategories: Object.keys(incomeCategoriesDefault),
          language: "es",
        };
        const incomeResponse = await categorizeFinancialData(incomeInput);
        finalIncomeItems = incomeResponse.categorizedItems;
      }
      setCategorizedIncomeItems(finalIncomeItems);

      if (
        analysisResult.expensesByProvider &&
        analysisResult.expensesByProvider.length > 0
      ) {
        const expenseInput: CategorizationInput = {
          itemsToCategorize: analysisResult.expensesByProvider,
          itemType: "expense",
          existingCategories: Object.keys(expenseCategoriesDefault),
          language: "es",
        };
        const expenseResponse = await categorizeFinancialData(expenseInput);
        finalExpenseItems = expenseResponse.categorizedItems;
      }
      setCategorizedExpenseItems(finalExpenseItems);

      success = true;
      onCategorizationDataUpdate({
        income: finalIncomeItems,
        expenses: finalExpenseItems,
      });

      toast({
        title: "Autocategorización Completada",
        description: "Las transacciones han sido categorizadas por la IA.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error durante la autocategorización:", error);
      success = false;
      toast({
        title: "Error en Autocategorización",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error desconocido.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
      onCategorizationComplete(success);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "-";
    return `${amount.toLocaleString(undefined, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${detectedCurrency || ""}`;
  };

  const showCategorizedView =
    categorizedIncomeItems !== null || categorizedExpenseItems !== null;

  return (
    <Card className="flex flex-col w-full h-full overflow-hidden">
      <CardHeader className="p-3">
        <CardTitle className="text-base">
          Análisis y Categorización de Extractos
        </CardTitle>
        {(totalIncome !== undefined || totalExpenses !== undefined) && (
          <CardDescription className="text-xs">
            <span>
              Ingresos Totales:{" "}
              <strong className="text-green-600">
                {formatCurrency(totalIncome)}
              </strong>
            </span>
            <span className="mx-2">|</span>
            <span>
              Gastos Totales:{" "}
              <strong className="text-red-600">
                {formatCurrency(totalExpenses)}
              </strong>
            </span>
            {analysisResult.unassignedTransactions !== undefined &&
              analysisResult.unassignedTransactions > 0 && (
                <>
                  <span className="mx-2">|</span>
                  <span>
                    No Asignadas:{" "}
                    <strong>{analysisResult.unassignedTransactions}</strong>
                  </span>
                </>
              )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full p-3 pt-0">
          {showCategorizedView ? (
            <>
              <CategorizedAccordion
                title="Ingresos Categorizados"
                groupedData={groupedCategorizedIncome}
                currency={detectedCurrency}
              />
              <Separator className="my-3" />
              <CategorizedAccordion
                title="Gastos Categorizados"
                groupedData={groupedCategorizedExpenses}
                currency={detectedCurrency}
              />
            </>
          ) : (
            <>
              <ProviderTable
                title="Ingresos por Pagador"
                data={incomeByProvider}
                currency={detectedCurrency}
              />
              <Separator className="my-3" />
              <ProviderTable
                title="Gastos por Beneficiario"
                data={expensesByProvider}
                currency={detectedCurrency}
              />
              {(!incomeByProvider || incomeByProvider.length === 0) &&
                (!expensesByProvider || expensesByProvider.length === 0) && (
                  <p className="text-sm text-muted-foreground p-2 text-center">
                    No se identificaron transacciones detalladas por proveedor.
                  </p>
                )}
            </>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-2 border-t flex items-center justify-center gap-2">
        <Button
          onClick={handleAutocategorize}
          disabled={
            isCategorizing ||
            status === "Error Parsing" ||
            status === "No Data Identified"
          }
          className="flex-1 text-xs h-8"
        >
          {isCategorizing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
          )}
          Autocategorizar
        </Button>
     <ReferenceCategoriesDialog
  open={isCategoryModalOpen}
  onOpenChange={setIsCategoryModalOpen}
  expenseCategories={expenseCategories}
  incomeCategories={incomeCategories}
  onChangeExpenseCategories={setExpenseCategories}
  onChangeIncomeCategories={setIncomeCategories}
/>
      </CardFooter>
    </Card>
  );
}
