
"use client";

import type { BankStatementSummary, ProviderTransactionSummary } from '@/ai/flows/analyze-bank-statements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RecordCategorizerProps {
  analysisResult: BankStatementSummary;
}

const expenseCategories: string[] = [
  "Vivienda: Alquiler / Hipoteca", "Vivienda: Comunidad de Propietarios", "Vivienda: IBI (Impuesto sobre Bienes Inmuebles)", "Vivienda: Seguro del Hogar", "Vivienda: Reparaciones y Mantenimiento",
  "Suministros: Luz", "Suministros: Agua", "Suministros: Gas / Calefacción", "Suministros: Internet", "Suministros: Telefonía (Fija y Móvil)", "Suministros: Plataformas de Streaming / TV de pago",
  "Alimentación: Supermercado y Comestibles", "Alimentación: Comida a Domicilio / Para Llevar",
  "Restaurantes y Ocio: Restaurantes y Cafés", "Restaurantes y Ocio: Bares y Copas", "Restaurantes y Ocio: Cine, Teatro, Conciertos", "Restaurantes y Ocio: Eventos Deportivos", "Restaurantes y Ocio: Libros, Música, Videojuegos", "Restaurantes y Ocio: Hobbies y Aficiones",
  "Transporte: Transporte Público", "Transporte: Combustible", "Transporte: Mantenimiento y Reparación de Vehículo", "Transporte: Seguro de Vehículo", "Transporte: Peajes y Aparcamiento", "Transporte: Taxis / VTC",
  "Salud y Bienestar: Seguro Médico / Sanidad Privada", "Salud y Bienestar: Farmacia y Medicamentos", "Salud y Bienestar: Consultas Médicas y Especialistas", "Salud y Bienestar: Gimnasio / Actividades Deportivas",
  "Cuidado Personal: Peluquería y Estética", "Cuidado Personal: Productos de Higiene y Cosmética",
  "Compras: Ropa y Calzado", "Compras: Tecnología y Electrónica", "Compras: Muebles y Decoración del Hogar", "Compras: Grandes Almacenes",
  "Educación: Matrículas y Tasas Académicas", "Educación: Libros y Material de Estudio", "Educación: Cursos y Formación",
  "Familia y Niños: Guardería / Cuidado Infantil", "Familia y Niños: Colegio", "Familia y Niños: Actividades Extraescolares", "Familia y Niños: Ropa y Artículos para Niños",
  "Finanzas: Pago de Préstamos", "Finanzas: Comisiones Bancarias", "Finanzas: Transferencias a Ahorro/Inversión", "Finanzas: Seguros (Vida, Decesos)",
  "Impuestos y Tasas: Declaración de la Renta (IRPF)", "Impuestos y Tasas: Otros Impuestos",
  "Viajes y Vacaciones: Alojamientos", "Viajes y Vacaciones: Billetes de Transporte", "Viajes y Vacaciones: Actividades y Gastos en Destino",
  "Regalos y Donaciones: Regalos", "Regalos y Donaciones: Donaciones a ONGs / Caridad",
  "Mascotas: Alimentación", "Mascotas: Veterinario y Cuidados Médicos", "Mascotas: Accesorios y Juguetes",
  "Trabajo / Negocio: Gastos de Oficina", "Trabajo / Negocio: Software y Herramientas", "Trabajo / Negocio: Viajes de Negocios",
  "Otros Gastos"
];

const incomeCategories: string[] = [
  "Nómina / Salario",
  "Trabajo Autónomo / Freelance",
  "Prestaciones y Subsidios: Prestación por Desempleo", "Prestaciones y Subsidios: Bajas por Enfermedad / Maternidad / Paternidad", "Prestaciones y Subsidios: Ayudas Gubernamentales",
  "Pensiones: Pensión de Jubilación", "Pensiones: Pensión de Viudedad / Orfandad", "Pensiones: Pensión por Incapacidad",
  "Ingresos por Alquileres",
  "Ingresos por Inversiones: Intereses", "Ingresos por Inversiones: Dividendos de acciones", "Ingresos por Inversiones: Ganancias por venta de activos",
  "Regalos y Transferencias Recibidas", "Regalos y Transferencias Recibidas: Herencias",
  "Ventas y Reembolsos: Venta de artículos personales", "Ventas y Reembolsos: Reembolsos de compras o servicios", "Ventas y Reembolsos: Devoluciones de impuestos",
  "Otros Ingresos: Premios", "Otros Ingresos: Colaboraciones esporádicas"
];

const ProviderTable: React.FC<{ title: string; data: ProviderTransactionSummary[] | undefined; currency: string | undefined }> = ({ title, data, currency }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground px-1 py-2">No hay datos de {title.toLowerCase()} por proveedor.</p>;
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
            <TableRow key={index}>
              <TableCell className="py-1.5 font-medium truncate max-w-32 md:max-w-40">{item.providerName}</TableCell>
              <TableCell className="py-1.5 text-center">{item.transactionCount}</TableCell>
              <TableCell className="py-1.5 text-right">
                {item.totalAmount.toLocaleString(undefined, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {currency && <span className="ml-1 text-muted-foreground">{currency}</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


export function RecordCategorizer({ analysisResult }: RecordCategorizerProps) {
  const { incomeByProvider, expensesByProvider, totalIncome, totalExpenses, detectedCurrency, unassignedTransactions } = analysisResult;

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-';
    return `${amount.toLocaleString(undefined, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${detectedCurrency || ''}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 max-h-[calc(100vh-250px)] md:max-h-[550px] p-1">
      {/* Columna Izquierda: Tabla de Análisis */}
      <Card className="flex flex-col md:w-1/2 overflow-hidden">
        <CardHeader className="p-3">
          <CardTitle className="text-base">Resumen del Análisis</CardTitle>
          { (totalIncome !== undefined || totalExpenses !== undefined) &&
            <CardDescription className="text-xs">
                <span>Ingresos Totales: <strong className="text-green-600">{formatCurrency(totalIncome)}</strong></span>
                <span className="mx-2">|</span>
                <span>Gastos Totales: <strong className="text-red-600">{formatCurrency(totalExpenses)}</strong></span>
                {unassignedTransactions !== undefined && unassignedTransactions > 0 && 
                  <span className="mx-2">|</span> }
                {unassignedTransactions !== undefined && unassignedTransactions > 0 && 
                  <span>No Asignadas: <strong>{unassignedTransactions}</strong></span> }
            </CardDescription>
          }
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden"> {/* flex-1 here makes CardContent take remaining space in Card */}
          <ScrollArea className="h-full p-3 pt-0"> {/* h-full makes ScrollArea fill CardContent */}
            <ProviderTable title="Ingresos por Pagador" data={incomeByProvider} currency={detectedCurrency} />
            <Separator className="my-3" />
            <ProviderTable title="Gastos por Beneficiario" data={expensesByProvider} currency={detectedCurrency} />
             {(!incomeByProvider || incomeByProvider.length === 0) && (!expensesByProvider || expensesByProvider.length === 0) && (
                <p className="text-sm text-muted-foreground p-2 text-center">No se identificaron transacciones detalladas por proveedor.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Columna Derecha: Categorías */}
      {/* En pantallas pequeñas (apilado vertical), flex-1 hace que este div tome el espacio vertical disponible. */}
      {/* En pantallas md y superiores (lado a lado), md:w-1/2 y md:h-full lo dimensionan correctamente. */}
      <div className="flex flex-col flex-1 md:flex-initial md:w-1/2 md:h-full gap-3 md:gap-4 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden"> {/* flex-1 asegura que esta Card tome la mitad de la altura de su padre (este div) */}
          <CardHeader className="p-3">
            <CardTitle className="text-base">Categorías de Gastos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden"> {/* flex-1 para que CardContent llene la Card */}
            <ScrollArea className="h-full p-3 pt-0"> {/* h-full para que ScrollArea llene CardContent */}
              <div className="space-y-1.5">
                {expenseCategories.map((category, index) => (
                  <Badge key={index} variant="outline" className="mr-1.5 mb-1.5 text-xs font-normal">{category}</Badge>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="flex-1 flex flex-col overflow-hidden"> {/* flex-1 asegura que esta Card tome la mitad de la altura de su padre (este div) */}
          <CardHeader className="p-3">
            <CardTitle className="text-base">Categorías de Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden"> {/* flex-1 para que CardContent llene la Card */}
            <ScrollArea className="h-full p-3 pt-0"> {/* h-full para que ScrollArea llene CardContent */}
              <div className="space-y-1.5">
                {incomeCategories.map((category, index) => (
                  <Badge key={index} variant="outline" className="mr-1.5 mb-1.5 text-xs font-normal">{category}</Badge>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    