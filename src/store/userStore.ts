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

interface UserData {
  name: string;
  generalObjectives?: string[];
  specificObjectives?: string[]; 
  expensesIncomeSummary?: EnhancedExpenseIncomeSummary; 
  actionPlan?: any;
}

interface UserStore {
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
}

// Type assertion for the imported JSON data
const typedJsonData = jsonData as UserData;

const useUserStore = create<UserStore>((set) => ({
  userData: null,
  setUserData: (data) => set({ userData: data }),
}));

export default useUserStore;
export type {
  UserData,
  EnhancedExpenseIncomeSummary,
  BankStatementSummary,
  CategorizedItem,
  ProviderTransactionSummary,
};
