export interface Transaction {
  id?: string | number;
  transactionId?: string; // e.g. "TXN0001"
  userId: string; // e.g. "SOCITY0001"
  userUid?: string; // Firebase Auth UID
  userName?: string;
  type: 'credit' | 'debit' | 'loan' | 'payment';
  category?: 'contribution' | 'loan_disbursement' | 'emi_payment' | 'admin_topup' | 'adjustment' | string;
  amount: number;
  description: string;
  createdBy?: string;
  createdAt?: any; // Timestamp or string
  date?: string; // YYYY-MM-DD
  referenceId?: string; // loanId or paymentId
  balanceAfter?: number;
}
