export interface User {
  id: number;
  userId: string; // e.g. "SOCITY0001"
  name: string;
  mobile: string;
  email: string;
  password?: string;
  totalAmount: number; // Society balance / savings / contributions
  role?: 'user' | 'admin';
  createdAt: string; // "YYYY-MM-DD"
  status?: 'Active' | 'Inactive';
  address?: string;
  occupation?: string;
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
