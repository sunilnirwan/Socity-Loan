export interface RepaymentInstallment {
  installmentNumber: number; // 1 to 12
  amount: number; // EMI amount
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  status: 'Pending' | 'Paid';
  paymentId?: string;
  paymentMethod?: string;
  transactionRef?: string;
}

export interface Loan {
  id: number;
  loanId: string; // e.g. "LOAN0001"
  userId: string; // e.g. "SOCITY0001"
  userName: string;
  loanAmount: number;
  monthlyEMI: number; // loanAmount / 12
  loanPurpose: string;
  loanDate: string; // YYYY-MM-DD
  status: 'Active' | 'Completed';
  totalMonths: 12;
  paidMonths: number;
  remainingMonths: number;
  paidAmount: number;
  pendingAmount: number;
  repaymentSchedule: RepaymentInstallment[];
}
