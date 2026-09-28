export interface Transaction {
  id: number;
  transactionId: string; // e.g. "TXN0001"
  userId: string;
  userName?: string;
  type: 'credit' | 'debit';
  category: 'contribution' | 'loan_disbursement' | 'emi_payment' | 'admin_topup' | 'adjustment';
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  referenceId?: string; // loanId or paymentId
  balanceAfter?: number;
}
