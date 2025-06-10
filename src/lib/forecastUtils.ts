// En tu archivo lib/forecastUtils.ts
import { UserData, CategorizedItem } from "@/store/userStore"; // Asegúrate de importar CategorizedItem

const SUBSCRIPTION_KEYWORDS = [
  "netflix",
  "spotify",
  "hbo",
  "prime",
  "disney+",
  "suscripción",
  "gym",
  "gimnasio",
];
const NON_ESSENTIAL_CATEGORIES = [
  "Restaurantes y Ocio",
  "Comida a Domicilio",
  "Compras Online",
  "Viajes",
  "Entretenimiento",
];

export interface ExpenseRemovedDetail {
  description: string; // Ej: "Suscripción: Netflix", "Restaurantes y Ocio (50% recorte)"
  originalAmount: number; // Monto original del gasto
  amountRemoved: number; // Monto que se le ha quitado al gasto
  type: 'subscription' | 'nonEssential';
  percentageRemoved?: number; // Opcional: porcentaje de recorte si aplica
}

export interface SavingsScenario {
  simple: number;
  moderate: number;
  max: number;
  // Nuevas propiedades para almacenar los detalles exactos de los gastos eliminados/reducidos
  simpleDetails: ExpenseRemovedDetail[];
  moderateDetails: ExpenseRemovedDetail[];
  maxDetails: ExpenseRemovedDetail[];
}

export function calculateMonthlySavings(userData: UserData): SavingsScenario {
  const expenses = userData.expensesIncomeSummary?.categorizedExpenseItems || [];

  // Categorizar gastos en suscripciones y no esenciales para facilitar el procesamiento
  const categorizedExpenses = {
    subscriptions: [] as CategorizedItem[],
    nonEssentials: [] as CategorizedItem[],
  };

  for (const item of expenses) {
    const providerName = item.providerName.toLowerCase();
    if (SUBSCRIPTION_KEYWORDS.some((keyword) => providerName.includes(keyword))) {
      categorizedExpenses.subscriptions.push(item);
    } else if (NON_ESSENTIAL_CATEGORIES.includes(item.suggestedCategory)) {
      categorizedExpenses.nonEssentials.push(item);
    }
  }

  const scenarios: SavingsScenario = {
    simple: 0,
    moderate: 0,
    max: 0,
    simpleDetails: [],
    moderateDetails: [],
    maxDetails: [],
  };

  // --- Función auxiliar para calcular recortes y detalles ---
  const calculateRecuts = (
    subCutPercentage: number,
    nonEssentialCutPercentage: number
  ): { total: number; details: ExpenseRemovedDetail[] } => {
    let totalCut = 0;
    const details: ExpenseRemovedDetail[] = [];

    // Recortes de suscripciones
    categorizedExpenses.subscriptions.forEach(sub => {
      const amount = sub.totalAmount;
      const cutAmount = amount * subCutPercentage;
      if (cutAmount > 0) {
        totalCut += cutAmount;
        details.push({
          description: `Suscripción: ${sub.providerName}`,
          originalAmount: amount,
          amountRemoved: cutAmount,
          type: 'subscription',
          percentageRemoved: subCutPercentage * 100,
        });
      }
    });

    // Recortes de gastos no esenciales
    categorizedExpenses.nonEssentials.forEach(nonEss => {
      const amount = nonEss.totalAmount;
      const cutAmount = amount * nonEssentialCutPercentage;
      if (cutAmount > 0) {
        totalCut += cutAmount;
        details.push({
          description: `${nonEss.suggestedCategory}: ${nonEss.providerName || 'Varios'}`,
          originalAmount: amount,
          amountRemoved: cutAmount,
          type: 'nonEssential',
          percentageRemoved: nonEssentialCutPercentage * 100,
        });
      }
    });

    return { total: totalCut, details };
  };

  // --- Escenario Ahorro Simple ---
  const simpleRecuts = calculateRecuts(0.5, 0.15); // 50% subs, 15% no esenciales
  scenarios.simple = simpleRecuts.total;
  scenarios.simpleDetails = simpleRecuts.details;

  // --- Escenario Ahorro Moderado ---
  const moderateRecuts = calculateRecuts(0.8, 0.4); // 80% subs, 40% no esenciales
  scenarios.moderate = moderateRecuts.total;
  scenarios.moderateDetails = moderateRecuts.details;

  // --- Escenario Ahorro Máximo ---
  const maxRecuts = calculateRecuts(1.0, 0.75); // 100% subs, 75% no esenciales
  scenarios.max = maxRecuts.total;
  scenarios.maxDetails = maxRecuts.details;

  return scenarios;
}

export function generateForecastData(userData: UserData) {
  const data = [];
  const today = new Date();

  const monthlySavings = calculateMonthlySavings(userData);

  let simpleSavings = 0;
  let moderateSavings = 0;
  let maxSavings = 0;

  for (let i = 0; i < 12; i++) {
    const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);

    simpleSavings += monthlySavings.simple;
    moderateSavings += monthlySavings.moderate;
    maxSavings += monthlySavings.max;

    data.push({
      month: futureDate.toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      }),
      ahorroSimple: Math.round(simpleSavings),
      ahorroModerado: Math.round(moderateSavings),
      ahorroMaximo: Math.round(maxSavings),
    });
  }
  return data;
}