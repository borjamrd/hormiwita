
"use client";

import type { UserData } from '@/ai/flows/generate-chat-response';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, RefreshCcw } from 'lucide-react';
import useUserStore from "@/store/userStore"
import { useRouter } from 'next/navigation';

interface ConfirmOnboardingProps {
  userData: UserData | undefined; // Make userData potentially undefined
  onAccept: () => void;
  onCancel: () => void; // Renamed from onReset for clarity, maps to handleResetChat
  isLoading: boolean;
}

export function ConfirmOnboarding({ userData, onAccept, onCancel, isLoading }: ConfirmOnboardingProps) {

  const router = useRouter();

  const saveAndNavigate = () => {
    if (userData) { // Only save if userData is defined
      useUserStore.getState().setUserData(userData);
    }
    router.push('/dashboard');
  };

  const formatList = (list: string[] | undefined) => {
    if (!list || list.length === 0) return <span className="italic text-muted-foreground">No proporcionado</span>;
    return (
      <ul className="list-disc list-inside text-sm">
        {list.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    );
  };

  const formatCurrency = (amount: number | undefined, currency: string | undefined) => {
    if (amount === undefined) return '-';
    return `${amount.toLocaleString(undefined, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`;
  };


  return (
    <Card className="w-full shadow-none border-none max-h-[400px] flex flex-col">
      <CardHeader className="p-3 text-center">
        <CardTitle className="text-base font-semibold">Confirmar Información</CardTitle>
        <CardDescription className="text-xs">
          Por favor, revisa la información que hemos recopilado.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-3">
          {userData ? ( // Render content only if userData is defined
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">Información Personal:</h4>
                <p>Nombre: {userData.name || <span className="italic text-muted-foreground">No proporcionado</span>}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-1">Objetivos Generales:</h4>
                {formatList(userData.generalObjectives)}
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-1">Objetivos Concretos:</h4>
                {formatList(userData.specificObjectives)}
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-1">Relación de Gastos e Ingresos:</h4>
                {userData.expensesIncomeSummary?.originalSummary ? (
                  <>
                    <p>Ingresos Totales: <span className="font-semibold text-green-600">{formatCurrency(userData.expensesIncomeSummary.originalSummary.totalIncome, userData.expensesIncomeSummary.originalSummary.detectedCurrency)}</span></p>
                    <p>Gastos Totales: <span className="font-semibold text-red-600">{formatCurrency(userData.expensesIncomeSummary.originalSummary.totalExpenses, userData.expensesIncomeSummary.originalSummary.detectedCurrency)}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">({userData.expensesIncomeSummary.originalSummary.feedback})</p>
                  </>
                ) : (
                  <span className="italic text-muted-foreground">No proporcionado</span>
                )}
              </div>
              {/* Add additionalInfo section if/when re-introduced */}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">No hay datos para mostrar.</div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Modificar
        </Button>
        <Button onClick={saveAndNavigate} disabled={isLoading || !userData}> {/* Disable if userData is undefined */}
          <CheckCircle className="mr-2 h-4 w-4" />
          Aceptar
        </Button>
      </CardFooter>
    </Card>
  );
}
