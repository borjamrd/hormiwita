
"use client";

import type { UserData } from '@/ai/flows/generate-chat-response';
import { Accordion } from '@/components/ui/accordion';
import { AccordionSection } from './AccordionSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Target, FileText, Briefcase, CheckSquare } from 'lucide-react';

interface InfoPanelProps {
  userData: UserData;
}

export function InfoPanel({ userData }: InfoPanelProps) {
  return (
    <Card className="w-full h-full flex flex-col shadow-lg rounded-lg">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-primary" />
          Panel de Información
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={['personal-info', 'objectives']} className="w-full">
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
            value="objectives"
            title="Objetivos Financieros"
            icon={<Target className="h-5 w-5 mr-2 text-primary" />}
          >
            {userData?.objectives && userData.objectives.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {userData.objectives.map((obj, index) => (
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
            icon={<FileText className="h-5 w-5 mr-2 text-primary" />}
          >
            <p className="text-sm text-muted-foreground italic">Información pendiente.</p>
          </AccordionSection>

          <AccordionSection
            value="additional-info"
            title="Información Adicional"
            icon={<Briefcase className="h-5 w-5 mr-2 text-primary" />}
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
