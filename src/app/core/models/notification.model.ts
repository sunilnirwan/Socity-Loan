export interface AppNotification {
  id?: string | number;
  type: 'taken_loan' | 'installment_paid' | 'loan_completed' | 'credit' | 'system' | string;
  title: string;
  message: string;
  userId: string; // "SOCITY0001"
  userUid?: string; // Firebase Auth UID
  userName?: string;
  loanId?: string;
  amount?: number;
  isRead: boolean;
  createdAt: any; // Timestamp or string
  link?: string;
  paymentDocId?: string; // for 'payment_request' notifications
}
