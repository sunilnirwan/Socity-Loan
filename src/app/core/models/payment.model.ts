export interface Payment {
  id: number;
  paymentId: string; // e.g. "PAY0001"
  loanId: string;
  userId: string;
  userName: string;
  installmentNumber: number; // 1 to 12
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: 'UPI' | 'Net Banking' | 'Debit Card' | 'Society Balance' | 'Cash';
  transactionRef: string;
  status: 'Success';
  notes?: string;
}
