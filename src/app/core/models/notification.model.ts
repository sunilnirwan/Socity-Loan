export interface AppNotification {
  id: number;
  type: 'taken_loan' | 'installment_paid' | 'loan_completed' | 'admin_credit' | 'system';
  title: string;
  message: string;
  userId: string;
  userName?: string;
  loanId?: string;
  amount?: number;
  isRead: boolean;
  createdAt: string; // YYYY-MM-DD
  link?: string;
}
