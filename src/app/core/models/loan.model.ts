// Society rules
export const MONTHLY_DEPOSIT = 500;      // regular kist per share

/** Monthly deposit for a member: ₹500 × shares (default 1 share). */
export function depositFor(u: { shares?: number } | null | undefined): number {
  return MONTHLY_DEPOSIT * Math.max(1, u?.shares || 1);
}
export const DEPOSIT_START = '2025-01';  // society deposit plan: Jan 2025 – Dec 2027 (36 months)
export const DUE_DAY = 15;              // EMI + deposit due on the 15th of every month
export const LATE_FEE = 20;             // admin may add this when a payment is late
export const LOAN_MONTHS = 10;           // loan repaid in 10 installments
export const LOAN_INTEREST_RATE = 0.10;  // flat 10%: 10,000 -> 11,000
export const EARLY_CLOSURE_INTEREST_MONTHS = 3; // early clearance: remaining principal + 3 months' interest

/** Amount to collect when a loan is cleared early: remaining principal + up to 3 months of interest. */
export function earlySettlementAmount(l: { loanAmount: number; totalPayable?: number; totalMonths: number; paidMonths: number; pendingAmount: number }): number {
  const remaining = Math.max(0, l.totalMonths - l.paidMonths);
  const monthlyPrincipal = l.loanAmount / l.totalMonths;
  const monthlyInterest = ((l.totalPayable || l.loanAmount) - l.loanAmount) / l.totalMonths;
  const amount = Math.round(remaining * monthlyPrincipal + Math.min(EARLY_CLOSURE_INTEREST_MONTHS, remaining) * monthlyInterest);
  return Math.min(amount, l.pendingAmount);
}

export interface RepaymentInstallment {
  id?: string;
  installmentNo?: number; // 1 to totalMonths
  installmentNumber?: number; // alias
  amount: number; // EMI amount = totalPayable / totalMonths
  dueDate: any; // Timestamp or string (YYYY-MM-DD)
  paidDate?: any; // Timestamp or string (YYYY-MM-DD)
  status: 'pending' | 'paid' | 'Pending' | 'Paid';
  paymentId?: string;
  paymentMethod?: string;
  transactionRef?: string;
}

export interface Loan {
  id?: string | number;
  loanId: string; // e.g. "LOAN0001"
  userId: string; // e.g. "SOCITY0001"
  userUid?: string; // Firebase Auth UID
  userName: string;
  loanAmount: number;
  totalPayable?: number; // loanAmount + interest
  monthlyInstallment?: number; // totalPayable / totalMonths
  monthlyEMI?: number; // alias
  loanPurpose: string;
  loanDate: any; // Timestamp or string
  status: 'active' | 'completed' | 'Active' | 'Completed' | 'Pending' | 'Rejected';
  totalMonths: number;
  paidMonths: number;
  remainingMonths: number;
  paidAmount: number;
  pendingAmount: number;
  createdAt?: any;
  updatedAt?: any;
  repaymentSchedule?: RepaymentInstallment[];
}
