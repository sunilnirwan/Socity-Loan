export interface Payment {
  id?: string | number;
  paymentId: string; // e.g. "PAY0001"
  loanId: string;
  userId: string; // e.g. "SOCITY0001"
  userUid?: string; // Firebase Auth UID
  userName?: string;
  installmentNo?: number; // 1 to 12
  installmentNumber?: number; // alias
  amount: number; // loan EMI part
  depositAmount?: number; // regular monthly deposit paid together with the EMI
  paymentDate: any; // Timestamp or string
  paymentMethod?: 'UPI' | 'Net Banking' | 'Debit Card' | 'Society Balance' | 'Cash' | string;
  transactionRef?: string;
  status?: 'Success' | 'success' | 'Pending' | 'Rejected';
  notes?: string;
  createdAt?: any;
}
