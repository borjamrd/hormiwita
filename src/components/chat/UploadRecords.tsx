
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { analyzeBankStatement, type AnalyzeBankStatementInput, type BankStatementSummary } from '@/ai/flows/analyze-bank-statements';
import { useToast } from "@/hooks/use-toast";

interface UploadRecordsProps {
  onAnalysisConfirmed: (summary: BankStatementSummary) => void;
  isLoadingConversation: boolean; // To disable while chatbot is thinking
}

export function UploadRecords({ onAnalysisConfirmed, isLoadingConversation }: UploadRecordsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BankStatementSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setSelectedFile(file);
      setAnalysisResult(null); // Reset previous analysis
      setError(null);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

    try {
      const dataUri = await fileToDataUri(selectedFile);
      const input: AnalyzeBankStatementInput = { statementDataUri: dataUri };
      const result = await analyzeBankStatement(input);
      setAnalysisResult(result);
      if (result.status === "Error Parsing" || result.status === "No Data Identified") {
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
            description: `Estado: ${result.status}`,
        });
      }
    } catch (err) {
      console.error("Error analyzing bank statement:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido durante el análisis.";
      setError(`Error al analizar el archivo: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Error de Análisis",
        description: errorMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndSend = () => {
    if (analysisResult) {
      onAnalysisConfirmed(analysisResult);
    }
  };

  return (
    <Card className="w-full shadow-none border-none">
      <CardHeader className="text-center p-2 pt-0">
        <CardTitle className="text-base font-semibold">Relación de Gastos e Ingresos</CardTitle>
        <CardDescription className="text-xs">
          Adjunta un histórico de tus últimos extractos bancarios.
          <br />
          Formato admitido: Excel (.xlsx) o CSV (.csv). Máx 5MB.
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
              accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
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

        {error && (
          <div className="text-xs text-destructive p-2 bg-destructive/10 rounded-md flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}

        {analysisResult && (
          <div className="mt-3 p-2 border rounded-md bg-background">
            <h4 className="text-xs font-semibold mb-1 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-primary"/>
                Resultado del Análisis:
            </h4>
            <pre className="text-xs p-2 bg-muted rounded-md overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2">
        <Button
          onClick={handleConfirmAndSend}
          disabled={!analysisResult || isAnalyzing || isLoadingConversation || analysisResult.status === "Error Parsing" || analysisResult.status === "No Data Identified"}
          className="w-full text-xs h-8"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Confirmar y Enviar Resumen al Chat
        </Button>
      </CardFooter>
    </Card>
  );
}
