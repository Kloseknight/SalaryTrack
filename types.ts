
export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 'Salary' | 'Bonus' | 'Freelance' | 'Investment' | 'Other';
export type ExpenseCategory = 'Rent' | 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Healthcare' | 'Other';

export interface LineItem {
  name: string;
  amount: number;
  ytd?: number;
  type: 'earning' | 'deduction' | 'benefit';
}

export interface Disbursement {
  bankCode: string;
  bankName: string;
  accountNo: string;
  amount: number;
}

export interface FinancialEntry {
  id: string;
  type: TransactionType;
  date: string;
  source: string; // Employer for income, Merchant/Desc for expense
  category: IncomeCategory | ExpenseCategory;
  amount: number; // Net amount for income, Total for expense
  grossAmount?: number;
  tax?: number;
  deductions?: number;
  currency: string;
  notes?: string;
  // Professional Details
  jobTitle?: string;
  department?: string;
  workedHours?: number;
  taxCode?: string;
  ytdGross?: number;
  ytdNet?: number;
  lineItems?: LineItem[];
  disbursements?: Disbursement[];
}

export type AppView = 'dashboard' | 'history' | 'add' | 'insights';
