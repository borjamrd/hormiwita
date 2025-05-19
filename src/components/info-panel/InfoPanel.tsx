
"use client";

import type { UserData } from '@/ai/flows/generate-chat-response';
import { Accordion } from '@/components/ui/accordion';
import { AccordionSection } from './AccordionSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Target, FileText, Briefcase, CheckSquare, ListChecks, FilePieChart } from 'lucide-react';

interface InfoPanelProps {
  userData: UserData;
}

export function InfoPanel({ userData }: InfoPanelProps) {
  const defaultOpenSections = ['personal-info'];
  if (userData?.name) defaultOpenSections.push('general-objectives');
  if (userData?.generalObjectives && userData.generalObjectives.length > 0) defaultOpenSections.push('specific-objectives');
  if (userData?.specificObjectives && userData.specificObjectives.length > 0) defaultOpenSections.push('expenses-income');


  return (
    <Card className="w-full flex flex-col shadow-lg rounded-lg fixed top-10">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-primary" />
          Panel de Información
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={defaultOpenSections} className="w-full">
          <AccordionSection
            value="personal-info"
            title="Información Personal"
            icon={<User className="h-5 w-5 mr-2 text-primary" />}
          >
            {userData?.name ? (
              <p className="text-sm text-foreground">Nombre: {userData.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aún no proporcionado.</p>
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
                  <li key={index} className="text-sm text-foreground">{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aún no definidos.</p>
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
                  <li key={index} className="text-sm text-foreground">{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aún no definidos.</p>
            )}
          </AccordionSection>

          <AccordionSection
            value="expenses-income"
            title="Relación de Gastos e Ingresos"
            icon={<FilePieChart className="h-5 w-5 mr-2 text-primary" />}
          >
            {userData?.expensesIncomeSummary ? (
              <div>
                <p className="text-sm text-foreground"><span className="font-medium">Estado:</span> {userData.expensesIncomeSummary.status}</p>
                <p className="text-sm text-foreground mt-1"><span className="font-medium">Feedback:</span> {userData.expensesIncomeSummary.feedback}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Pendiente de carga y análisis de extractos.</p>
            )}
          </AccordionSection>

          <AccordionSection
            value="additional-info"
            title="Información Adicional"
            icon={<FileText className="h-5 w-5 mr-2 text-primary" />} 
          >
            <p className="text-sm text-muted-foreground italic">Información pendiente.</p>
          </AccordionSection>

          <AccordionSection
            value="summary"
            title="Resumen"
            icon={<CheckSquare className="h-5 w-5 mr-2 text-primary" />}
          >
            <p className="text-sm text-muted-foreground italic">Resumen pendiente.</p>
          </AccordionSection>
        </Accordion>
      </CardContent>
    </Card>
  );
}
