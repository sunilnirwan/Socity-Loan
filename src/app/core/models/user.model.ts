export interface User {
  uid?: string; // Firebase Auth UID
  userId: string; // e.g. "SOCITY0001"
  name: string;
  mobile: string;
  email: string;
  password?: string;
  totalAmount: number; // Society balance / contributions
  role?: 'user' | 'admin';
  status: 'active' | 'inactive' | 'Active' | 'Inactive';
  createdAt: any; // Timestamp or string (ISO)
  updatedAt?: any;
  address?: string;
  occupation?: string;
  shares?: number; // society shares held; monthly deposit = ₹500 × shares
  id?: number | string; // Compatibility alias
}

export interface UserSummary {
  user: User;
  totalLoansAmount: number;
  activeLoansCount: number;
  completedLoansCount: number;
  paidLoanAmount: number;
  pendingLoanAmount: number;
  loanStatus: 'No Loan' | 'Loan Active' | 'Loan Completed';
}
