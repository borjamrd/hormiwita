import { create } from "zustand";
import jsonData from "./dummy.json";

interface ProviderTransactionSummary {
  providerName: string;
  totalAmount: number;
  transactionCount: number;
}

interface CategorizedItem extends ProviderTransactionSummary {
  suggestedCategory: string;
}

interface BankStatementSummary {
  feedback: string;
  status:
    | "Success"
    | "Partial Data"
    | "Error Parsing"
    | "No Data Identified"
    | "Unsupported File Type";
  detectedCurrency?: string;
  expensesByProvider?: ProviderTransactionSummary[];
  incomeByProvider?: ProviderTransactionSummary[];
  totalExpenses?: number;
  totalIncome?: number;
  unassignedTransactions?: number;
}

interface EnhancedExpenseIncomeSummary {
  originalSummary: BankStatementSummary;
  categorizedIncomeItems?: CategorizedItem[] | null;
  categorizedExpenseItems?: CategorizedItem[] | null;
}

export interface RoadmapStep {
  objective: string;
  title: string;
  description: string;
  flowIdentifier: string;
  status: "pending" | "in_progress" | "completed";
}

export interface Roadmap {
  introduction: string;
  steps: RoadmapStep[];
}

interface UserData {
  name: string;
  generalObjectives?: string[];
  specificObjectives?: string[];
  expensesIncomeSummary?: EnhancedExpenseIncomeSummary;
  actionPlan?: any;
  roadmap?: Roadmap | null;
}

interface UserStore {
  userData: UserData | null;
  setUserData: (data: Partial<UserData> | null) => void;
  setRoadmap: (roadmap: Roadmap) => void;
  updateRoadmapStepStatus: (
    objective: string,
    status: RoadmapStep["status"]
  ) => void;
}
// Type assertion for the imported JSON data
const typedJsonData = jsonData as UserData;

const useUserStore = create<UserStore>((set) => ({
  userData: null,
  setUserData: (data) => {
    return set((state) => ({
      userData: data ? ({ ...state.userData, ...data } as UserData) : null,
    }));
  },
  setRoadmap: (roadmap) =>
    set((state) => {
      if (!state.userData) return state;
      return {
        userData: { ...state.userData, roadmap },
      };
    }),

  updateRoadmapStepStatus: (objective, status) =>
    set((state) => {
      if (!state.userData || !state.userData.roadmap) return state;

      const newSteps = state.userData.roadmap.steps.map((step) =>
        step.objective === objective ? { ...step, status } : step
      );

      return {
        userData: {
          ...state.userData,
          roadmap: { ...state.userData.roadmap, steps: newSteps },
        },
      };
    }),
}));

export default useUserStore;
export type {
  UserData,
  EnhancedExpenseIncomeSummary,
  BankStatementSummary,
  CategorizedItem,
  ProviderTransactionSummary,
};
