// src/lib/objectives-config.ts

export interface SpecificObjective {
  name: string;
  flowIdentifier: string;
}

export interface GeneralObjective {
  category: string;
  specifics: SpecificObjective[];
}

export const objectivesConfig: GeneralObjective[] = [
  {
    category: "Ahorro",
    specifics: [
      { name: "Fondo de Emergencia", flowIdentifier: "emergencyFundFlow" },
      {
        name: "Ahorro para la Jubilación",
        flowIdentifier: "retirementSavingsFlow",
      },
      {
        name: "Ahorro para la Entrada de una Vivienda",
        flowIdentifier: "housingDownPaymentFlow",
      },
      {
        name: "Ahorro para la Compra de un Vehículo",
        flowIdentifier: "vehicleSavingsFlow",
      },
      {
        name: "Ahorro para Viajes/Vacaciones",
        flowIdentifier: "travelSavingsFlow",
      },
      { name: "Ahorro para Educación", flowIdentifier: "educationSavingsFlow" },
      {
        name: "Ahorro para Inversiones",
        flowIdentifier: "investmentSavingsFlow",
      },
      {
        name: "Ahorro para Compras Importantes",
        flowIdentifier: "majorPurchaseFlow",
      },
      {
        name: "Ahorro para Eventos Especiales",
        flowIdentifier: "specialEventFlow",
      },
    ],
  },
  {
    category: "Reducción y Gestión de Deuda",
    specifics: [
      {
        name: "Pagar Deudas de Tarjetas de Crédito",
        flowIdentifier: "creditCardDebtFlow",
      },
      {
        name: "Amortizar Préstamos Personales",
        flowIdentifier: "personalLoanDebtFlow",
      },
      {
        name: "Liquidar Préstamos Estudiantiles",
        flowIdentifier: "studentLoanDebtFlow",
      },
      { name: "Reducir la Hipoteca", flowIdentifier: "mortgageReductionFlow" },
      { name: "Consolidar Deudas", flowIdentifier: "debtConsolidationFlow" },
      {
        name: "Eliminar Deudas Pequeñas (Método Bola de Nieve o Avalancha)",
        flowIdentifier: "smallDebtsFlow",
      },
    ],
  },
  {
    category: "Gestión de Gastos",
    specifics: [
      {
        name: "Crear y Seguir un Presupuesto Mensual",
        flowIdentifier: "budgetingFlow",
      },
      {
        name: "Reducir Gastos Hormiga",
        flowIdentifier: "reduceMicroExpensesFlow",
      },
      {
        name: "Disminuir Gasto en Categorías Específicas",
        flowIdentifier: "reduceSpecificExpensesFlow",
      },
      {
        name: "Optimizar Gastos Fijos",
        flowIdentifier: "optimizeFixedExpensesFlow",
      },
    ],
  },
  {
    category: "Crecimiento Financiero",
    specifics: [
      { name: "Aumentar Ingresos", flowIdentifier: "increaseIncomeFlow" },
      {
        name: "Incrementar el Patrimonio Neto",
        flowIdentifier: "increaseNetWorthFlow",
      },
      {
        name: "Alcanzar la Independencia Financiera",
        flowIdentifier: "financialIndependenceFlow",
      },
    ],
  },
];

// Función de utilidad para encontrar un flowIdentifier por el nombre del objetivo
export function getFlowIdentifier(
  specificObjectiveName: string
): string | undefined {
  for (const general of objectivesConfig) {
    const specific = general.specifics.find(
      (s) => s.name === specificObjectiveName
    );
    if (specific) {
      return specific.flowIdentifier;
    }
  }
  return undefined;
}
