
"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { analyzeBankStatement, type AnalyzeBankStatementInput, type BankStatementSummary } from '@/ai/flows/analyze-bank-statements';
import type { CategorizedItem } from '@/ai/flows/categorize-financial-data'; // For typing categorized items
import type { EnhancedExpenseIncomeSummary } from '@/ai/flows/generate-chat-response'; // For the final structure
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx'; // For client-side Excel processing
import { RecordCategorizer } from './RecordCategorizer';

interface UploadRecordsProps {
  onAnalysisConfirmed: (summary: EnhancedExpenseIncomeSummary) => void;
  isLoadingConversation: boolean;
}

export function UploadRecords({ onAnalysisConfirmed, isLoadingConversation }: UploadRecordsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BankStatementSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenCategorized, setHasBeenCategorized] = useState(false);
  const [categorizedIncomeForConfirmation, setCategorizedIncomeForConfirmation] = useState<CategorizedItem[] | null>(null);
  const [categorizedExpensesForConfirmation, setCategorizedExpensesForConfirmation] = useState<CategorizedItem[] | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "Archivo Demasiado Grande",
          description: "Por favor, sube un archivo menor a 5MB.",
        });
        setSelectedFile(null);
        event.target.value = ""; // Reset file input
        return;
      }
      const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
      ];
      const isAllowedExtension = file.name.endsWith('.csv') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx');

      if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
        toast({
          variant: "destructive",
          title: "Tipo de Archivo no Soportado",
          description: "Por favor, sube un archivo .csv, .xls o .xlsx.",
        });
        setSelectedFile(null);
        event.target.value = ""; // Reset file input
        return;
      }

      setSelectedFile(file);
      setAnalysisResult(null);
      setError(null);
      setHasBeenCategorized(false);
      setCategorizedIncomeForConfirmation(null);
      setCategorizedExpensesForConfirmation(null);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Archivo no seleccionado",
        description: "Por favor, selecciona un archivo para analizar.",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setHasBeenCategorized(false);
    setCategorizedIncomeForConfirmation(null);
    setCategorizedExpensesForConfirmation(null);

    try {
      let csvTextContent: string;
      const fileName = selectedFile.name;

      if (fileName.endsWith('.csv')) {
        csvTextContent = await selectedFile.text();
      } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
            throw new Error("El archivo Excel no contiene hojas.");
        }
        const worksheet = workbook.Sheets[firstSheetName];
        csvTextContent = XLSX.utils.sheet_to_csv(worksheet);
         if (!csvTextContent.trim()) {
            throw new Error("La primera hoja del archivo Excel está vacía o no se pudo convertir a CSV.");
        }
      } else {
        // This case should ideally be caught by file type validation earlier
        throw new Error("Tipo de archivo no soportado para conversión a CSV.");
      }
      
      const base64Csv = Buffer.from(csvTextContent, 'utf-8').toString('base64');
      const dataUri = `data:text/csv;base64,${base64Csv}`;
      
      const input: AnalyzeBankStatementInput = {
        statementDataUri: dataUri,
        originalFileName: fileName,
      };
      const result = await analyzeBankStatement(input);
      setAnalysisResult(result);

      if (result.status === "Error Parsing" || result.status === "No Data Identified" || result.status === "Unsupported File Type") {
        setError(result.feedback);
         toast({
            variant: "destructive",
            title: `Error en Análisis: ${result.status}`,
            description: result.feedback,
        });
      } else {
         toast({
            variant: "default", 
            title: "Análisis Completado",
            description: `Estado: ${result.status}. Revisa y categoriza los resultados abajo.`, // Adjusted message
        });
      }
    } catch (err) {
      console.error("Error processing or analyzing file:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al procesar el archivo.";
      setError(`Error: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Error de Procesamiento",
        description: errorMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleCategorizationDataUpdate = useCallback((data: { income: CategorizedItem[] | null, expenses: CategorizedItem[] | null }) => {
    setCategorizedIncomeForConfirmation(data.income);
    setCategorizedExpensesForConfirmation(data.expenses);
  }, []);


  const handleConfirmAndSend = () => {
    if (analysisResult && 
        (analysisResult.status === "Success" || analysisResult.status === "Partial Data") && 
        hasBeenCategorized) {
      
      const enhancedSummary: EnhancedExpenseIncomeSummary = {
        originalSummary: analysisResult,
        categorizedIncomeItems: categorizedIncomeForConfirmation,
        categorizedExpenseItems: categorizedExpensesForConfirmation,
      };
      onAnalysisConfirmed(enhancedSummary);

    } else {
        toast({
            variant: "destructive",
            title: "No se puede continuar",
            description: "El análisis no fue exitoso o los datos no han sido categorizados.",
        });
    }
  };
  
  const canConfirm = analysisResult && 
                     (analysisResult.status === "Success" || analysisResult.status === "Partial Data") &&
                     hasBeenCategorized;

  return (
    <Card className="w-full shadow-none border-none">
      <CardHeader className="text-center p-2 pt-0">
        <CardTitle className="text-base font-semibold">Relación de Gastos e Ingresos</CardTitle>
        <CardDescription className="text-xs">
          Adjunta un histórico de tus últimos extractos bancarios.
          <br />
          Formato admitido: CSV (.csv), Excel (.xls, .xlsx). Máx 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 space-y-3">
        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-3 pb-4">
              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="mb-1 text-xs text-muted-foreground">
                <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
              </p>
            </div>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".csv, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
              onChange={handleFileChange}
              disabled={isAnalyzing || isLoadingConversation}
            />
          </label>
          {selectedFile && (
            <div className="flex items-center text-xs text-foreground p-1.5 bg-muted rounded-md w-full justify-center">
              <FileText className="w-4 h-4 mr-2 text-primary" />
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        <Button
          onClick={handleGenerateAnalysis}
          disabled={!selectedFile || isAnalyzing || isLoadingConversation}
          className="w-full text-xs h-8"
        >
          {isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generar Análisis
        </Button>

        {error && !analysisResult && (
          <div className="text-xs text-destructive p-2 bg-destructive/10 rounded-md flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}

        {analysisResult && (
          <div className="mt-3 p-0 border-none rounded-md bg-background">
             { (analysisResult.status === "Error Parsing" || analysisResult.status === "No Data Identified" || analysisResult.status === "Unsupported File Type") ? (
                <div className="text-xs text-destructive p-2 bg-destructive/10 rounded-md flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                    {analysisResult.feedback}
                </div>
             ) : (
                <RecordCategorizer 
                    analysisResult={analysisResult} 
                    onCategorizationComplete={setHasBeenCategorized}
                    onCategorizationDataUpdate={handleCategorizationDataUpdate}
                />
             )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2">
        <Button
          onClick={handleConfirmAndSend}
          disabled={!canConfirm || isAnalyzing || isLoadingConversation}
          className="w-full text-xs h-8"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Confirmar y continuar
        </Button>
      </CardFooter>
    </Card>
  );
}
