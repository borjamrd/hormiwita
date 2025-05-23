
"use client";

import type { UserData, EnhancedExpenseIncomeSummary } from '@/ai/flows/generate-chat-response';
import type { CategorizedItem } from '@/ai/flows/categorize-financial-data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AccordionSection } from './AccordionSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Target, FileText, Briefcase, /*CheckSquare,*/ ListChecks, FilePieChart, Eye } from 'lucide-react';
import { useState } from 'react';
import { CategorizedAccordion } from '@/components/chat/RecordCategorizer';


interface InfoPanelProps {
  userData: UserData;
}

// Helper type for CategorizedAccordion props within InfoPanel modal
interface GroupedCategoryData {
  total: number;
  providers: CategorizedItem[]; 
}


export function InfoPanel({ userData }: InfoPanelProps) {
  const [isCategorizationModalOpen, setIsCategorizationModalOpen] = useState(false);

  const defaultOpenSections = ['personal-info'];
  if (userData?.name) defaultOpenSections.push('general-objectives');
  if (userData?.generalObjectives && userData.generalObjectives.length > 0) defaultOpenSections.push('specific-objectives');
  if (userData?.specificObjectives && userData.specificObjectives.length > 0) defaultOpenSections.push('expenses-income');
  // Removed: additional-info and summary-plan from defaultOpenSections

  const formatCurrency = (amount: number | undefined, currency: string | undefined) => {
    if (amount === undefined) return '-';
    return `${amount.toLocaleString(undefined, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`;
  };

  const groupAndSumByCategory = (items: CategorizedItem[] | null | undefined, itemType: 'income' | 'expense'): Record<string, GroupedCategoryData> => {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const category = item.suggestedCategory || (itemType === 'income' ? "Otros Ingresos" : "Otros Gastos");
      if (!acc[category]) {
        acc[category] = { total: 0, providers: [] };
      }
      acc[category].total += item.totalAmount;
      acc[category].providers.push(item);
      return acc;
    }, {} as Record<string, GroupedCategoryData>);
  };

  const groupedCategorizedIncome = groupAndSumByCategory(userData.expensesIncomeSummary?.categorizedIncomeItems, 'income');
  const groupedCategorizedExpenses = groupAndSumByCategory(userData.expensesIncomeSummary?.categorizedExpenseItems, 'expense');

  const canViewCategorization = !!(userData.expensesIncomeSummary?.categorizedIncomeItems || userData.expensesIncomeSummary?.categorizedExpenseItems);

  return (
    <Card className="w-full h-full flex flex-col shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-primary" />
          Panel de Información
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto"> 
        <Accordion type="multiple" defaultValue={defaultOpenSections} className="w-full">
          <AccordionSection
            value="personal-info"
            title="Información Personal"
            icon={<User className="h-5 w-5 mr-2 text-primary" />}
          >
            {userData?.name ? (
              <p>Nombre: {userData.name}</p>
            ) : (
              <p className="italic text-muted-foreground">Aún no proporcionado.</p>
            )}
          </AccordionSection>

          <AccordionSection
            value="general-objectives"
            title="Objetivos Generales"
            icon={<Target className="h-5 w-5 mr-2 text-primary" />}
          >
            {userData?.generalObjectives && userData.generalObjectives.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {userData.generalObjectives.map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="italic text-muted-foreground">Aún no definidos.</p>
            )}
          </AccordionSection>

          <AccordionSection
            value="specific-objectives"
            title="Objetivos Concretos"
            icon={<ListChecks className="h-5 w-5 mr-2 text-primary" />}
          >
            {userData?.specificObjectives && userData.specificObjectives.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {userData.specificObjectives.map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="italic text-muted-foreground">Aún no definidos.</p>
            )}
          </AccordionSection>

          <AccordionSection
            value="expenses-income"
            title="Relación de Gastos e Ingresos"
            icon={<FilePieChart className="h-5 w-5 mr-2 text-primary" />}
          >
            {userData?.expensesIncomeSummary?.originalSummary ? (
              <div className="space-y-2">
                <p>
                  Ingresos Totales: <strong className="text-green-600">{formatCurrency(userData.expensesIncomeSummary.originalSummary.totalIncome, userData.expensesIncomeSummary.originalSummary.detectedCurrency)}</strong>
                </p>
                <p>
                  Gastos Totales: <strong className="text-red-600">{formatCurrency(userData.expensesIncomeSummary.originalSummary.totalExpenses, userData.expensesIncomeSummary.originalSummary.detectedCurrency)}</strong>
                </p>
                 {userData.expensesIncomeSummary.originalSummary.unassignedTransactions !== undefined && userData.expensesIncomeSummary.originalSummary.unassignedTransactions > 0 && (
                    <p>Trans. No Asignadas (análisis inicial): <strong>{userData.expensesIncomeSummary.originalSummary.unassignedTransactions}</strong></p>
                )}
                <Dialog open={isCategorizationModalOpen} onOpenChange={setIsCategorizationModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2 w-full" disabled={!canViewCategorization}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles de Categorización
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Detalles de Categorización</DialogTitle>
                      <CardDescription>
                        Resultados de la autocategorización realizada.
                      </CardDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden py-2">
                        <ScrollArea className="h-full pr-3">
                             <CategorizedAccordion 
                                title="Ingresos Categorizados" 
                                groupedData={groupedCategorizedIncome} 
                                currency={userData.expensesIncomeSummary?.originalSummary.detectedCurrency} 
                            />
                            <CategorizedAccordion 
                                title="Gastos Categorizados" 
                                groupedData={groupedCategorizedExpenses} 
                                currency={userData.expensesIncomeSummary?.originalSummary.detectedCurrency} 
                            />
                        </ScrollArea>
                    </div>
                    <DialogClose asChild className="mt-4">
                      <Button type="button" variant="outline">Cerrar</Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <p className="italic text-muted-foreground">Pendiente de carga y análisis de extractos.</p>
            )}
          </AccordionSection>

          {/* Removed Additional Info and Summary Plan sections */}
        </Accordion>
      </CardContent>
    </Card>
  );
}
