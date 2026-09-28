import { User } from '../models/user.model';
import { Loan } from '../models/loan.model';
import { Payment } from '../models/payment.model';
import { Transaction } from '../models/transaction.model';
import { AppNotification } from '../models/notification.model';
import { AdminConfig } from '../models/admin.model';

export const INITIAL_ADMIN: AdminConfig = {
  email: 'sunilnirwan55@gmail.com',
  name: 'Sunil Nirwan',
  role: 'admin',
  phone: '9876500000'
};

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    userId: 'SOCITY0001',
    name: 'Demo User',
    mobile: '9876543210',
    email: 'user@gmail.com',
    password: 'user@123',
    totalAmount: 25000,
    createdAt: '2026-08-01',
    status: 'Active',
    address: 'Flat 302, Palm Heights, Jaipur',
    occupation: 'Software Engineer'
  },
  {
    id: 2,
    userId: 'SOCITY0002',
    name: 'Rajesh Sharma',
    mobile: '9812345678',
    email: 'rajesh.sharma@gmail.com',
    password: 'user@123',
    totalAmount: 40000,
    createdAt: '2026-08-10',
    status: 'Active',
    address: 'Villa 14, Royal Greens, Jaipur',
    occupation: 'Business Consultant'
  },
  {
    id: 3,
    userId: 'SOCITY0003',
    name: 'Priya Patel',
    mobile: '9823456789',
    email: 'priya.patel@gmail.com',
    password: 'user@123',
    totalAmount: 15000,
    createdAt: '2026-08-15',
    status: 'Active',
    address: 'B-404, Sunrise Apartments, Jaipur',
    occupation: 'Architect'
  },
  {
    id: 4,
    userId: 'SOCITY0004',
    name: 'Amit Kumar',
    mobile: '9834567890',
    email: 'amit.kumar@gmail.com',
    password: 'user@123',
    totalAmount: 30000,
    createdAt: '2026-08-20',
    status: 'Active',
    address: 'House 58, Civil Lines, Jaipur',
    occupation: 'Chartered Accountant'
  },
  {
    id: 5,
    userId: 'SOCITY0005',
    name: 'Sneha Verma',
    mobile: '9845678901',
    email: 'sneha.verma@gmail.com',
    password: 'user@123',
    totalAmount: 15000,
    createdAt: '2026-08-25',
    status: 'Active',
    address: 'C-12, Vaishali Nagar, Jaipur',
    occupation: 'Teacher'
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: 1,
    loanId: 'LOAN0001',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    loanAmount: 12000,
    monthlyEMI: 1000,
    loanPurpose: 'Emergency Medical Expenses',
    loanDate: '2026-06-01',
    status: 'Active',
    totalMonths: 12,
    paidMonths: 4,
    remainingMonths: 8,
    paidAmount: 4000,
    pendingAmount: 8000,
    repaymentSchedule: [
      { installmentNumber: 1, amount: 1000, dueDate: '2026-06-28', paidDate: '2026-06-25', status: 'Paid', paymentId: 'PAY0001', paymentMethod: 'UPI', transactionRef: 'UPI/260625/8921' },
      { installmentNumber: 2, amount: 1000, dueDate: '2026-07-28', paidDate: '2026-07-26', status: 'Paid', paymentId: 'PAY0002', paymentMethod: 'Net Banking', transactionRef: 'NB/260726/4312' },
      { installmentNumber: 3, amount: 1000, dueDate: '2026-08-28', paidDate: '2026-08-27', status: 'Paid', paymentId: 'PAY0003', paymentMethod: 'UPI', transactionRef: 'UPI/260827/9012' },
      { installmentNumber: 4, amount: 1000, dueDate: '2026-09-28', paidDate: '2026-09-20', status: 'Paid', paymentId: 'PAY0004', paymentMethod: 'Society Balance', transactionRef: 'SOC/260920/1189' },
      { installmentNumber: 5, amount: 1000, dueDate: '2026-10-28', status: 'Pending' },
      { installmentNumber: 6, amount: 1000, dueDate: '2026-11-28', status: 'Pending' },
      { installmentNumber: 7, amount: 1000, dueDate: '2026-12-28', status: 'Pending' },
      { installmentNumber: 8, amount: 1000, dueDate: '2027-01-28', status: 'Pending' },
      { installmentNumber: 9, amount: 1000, dueDate: '2027-02-28', status: 'Pending' },
      { installmentNumber: 10, amount: 1000, dueDate: '2027-03-28', status: 'Pending' },
      { installmentNumber: 11, amount: 1000, dueDate: '2027-04-28', status: 'Pending' },
      { installmentNumber: 12, amount: 1000, dueDate: '2027-05-28', status: 'Pending' }
    ]
  },
  {
    id: 2,
    loanId: 'LOAN0002',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    loanAmount: 60000,
    monthlyEMI: 5000,
    loanPurpose: 'Home Renovation & Repair',
    loanDate: '2026-07-15',
    status: 'Active',
    totalMonths: 12,
    paidMonths: 2,
    remainingMonths: 10,
    paidAmount: 10000,
    pendingAmount: 50000,
    repaymentSchedule: [
      { installmentNumber: 1, amount: 5000, dueDate: '2026-08-15', paidDate: '2026-08-14', status: 'Paid', paymentId: 'PAY0005', paymentMethod: 'UPI', transactionRef: 'UPI/260814/5521' },
      { installmentNumber: 2, amount: 5000, dueDate: '2026-09-15', paidDate: '2026-09-12', status: 'Paid', paymentId: 'PAY0006', paymentMethod: 'Net Banking', transactionRef: 'NB/260912/7719' },
      { installmentNumber: 3, amount: 5000, dueDate: '2026-10-15', status: 'Pending' },
      { installmentNumber: 4, amount: 5000, dueDate: '2026-11-15', status: 'Pending' },
      { installmentNumber: 5, amount: 5000, dueDate: '2026-12-15', status: 'Pending' },
      { installmentNumber: 6, amount: 5000, dueDate: '2027-01-15', status: 'Pending' },
      { installmentNumber: 7, amount: 5000, dueDate: '2027-02-15', status: 'Pending' },
      { installmentNumber: 8, amount: 5000, dueDate: '2027-03-15', status: 'Pending' },
      { installmentNumber: 9, amount: 5000, dueDate: '2027-04-15', status: 'Pending' },
      { installmentNumber: 10, amount: 5000, dueDate: '2027-05-15', status: 'Pending' },
      { installmentNumber: 11, amount: 5000, dueDate: '2027-06-15', status: 'Pending' },
      { installmentNumber: 12, amount: 5000, dueDate: '2027-07-15', status: 'Pending' }
    ]
  },
  {
    id: 3,
    loanId: 'LOAN0003',
    userId: 'SOCITY0003',
    userName: 'Priya Patel',
    loanAmount: 24000,
    monthlyEMI: 2000,
    loanPurpose: 'Higher Education Course',
    loanDate: '2025-09-01',
    status: 'Completed',
    totalMonths: 12,
    paidMonths: 12,
    remainingMonths: 0,
    paidAmount: 24000,
    pendingAmount: 0,
    repaymentSchedule: [
      { installmentNumber: 1, amount: 2000, dueDate: '2025-10-01', paidDate: '2025-09-30', status: 'Paid', paymentId: 'PAY0007', paymentMethod: 'UPI', transactionRef: 'UPI/250930/1001' },
      { installmentNumber: 2, amount: 2000, dueDate: '2025-11-01', paidDate: '2025-10-31', status: 'Paid', paymentId: 'PAY0008', paymentMethod: 'UPI', transactionRef: 'UPI/251031/1002' },
      { installmentNumber: 3, amount: 2000, dueDate: '2025-12-01', paidDate: '2025-11-29', status: 'Paid', paymentId: 'PAY0009', paymentMethod: 'UPI', transactionRef: 'UPI/251129/1003' },
      { installmentNumber: 4, amount: 2000, dueDate: '2026-01-01', paidDate: '2025-12-30', status: 'Paid', paymentId: 'PAY0010', paymentMethod: 'UPI', transactionRef: 'UPI/251230/1004' },
      { installmentNumber: 5, amount: 2000, dueDate: '2026-02-01', paidDate: '2026-01-30', status: 'Paid', paymentId: 'PAY0011', paymentMethod: 'UPI', transactionRef: 'UPI/260130/1005' },
      { installmentNumber: 6, amount: 2000, dueDate: '2026-03-01', paidDate: '2026-02-28', status: 'Paid', paymentId: 'PAY0012', paymentMethod: 'UPI', transactionRef: 'UPI/260228/1006' },
      { installmentNumber: 7, amount: 2000, dueDate: '2026-04-01', paidDate: '2026-03-31', status: 'Paid', paymentId: 'PAY0013', paymentMethod: 'UPI', transactionRef: 'UPI/260331/1007' },
      { installmentNumber: 8, amount: 2000, dueDate: '2026-05-01', paidDate: '2026-04-30', status: 'Paid', paymentId: 'PAY0014', paymentMethod: 'UPI', transactionRef: 'UPI/260430/1008' },
      { installmentNumber: 9, amount: 2000, dueDate: '2026-06-01', paidDate: '2026-05-31', status: 'Paid', paymentId: 'PAY0015', paymentMethod: 'UPI', transactionRef: 'UPI/260531/1009' },
      { installmentNumber: 10, amount: 2000, dueDate: '2026-07-01', paidDate: '2026-06-30', status: 'Paid', paymentId: 'PAY0016', paymentMethod: 'UPI', transactionRef: 'UPI/260630/1010' },
      { installmentNumber: 11, amount: 2000, dueDate: '2026-08-01', paidDate: '2026-07-31', status: 'Paid', paymentId: 'PAY0017', paymentMethod: 'UPI', transactionRef: 'UPI/260731/1011' },
      { installmentNumber: 12, amount: 2000, dueDate: '2026-09-01', paidDate: '2026-08-31', status: 'Paid', paymentId: 'PAY0018', paymentMethod: 'UPI', transactionRef: 'UPI/260831/1012' }
    ]
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 1,
    paymentId: 'PAY0001',
    loanId: 'LOAN0001',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    installmentNumber: 1,
    amount: 1000,
    paymentDate: '2026-06-25',
    paymentMethod: 'UPI',
    transactionRef: 'UPI/260625/8921',
    status: 'Success',
    notes: 'Installment 1 of 12 paid via Google Pay UPI'
  },
  {
    id: 2,
    paymentId: 'PAY0002',
    loanId: 'LOAN0001',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    installmentNumber: 2,
    amount: 1000,
    paymentDate: '2026-07-26',
    paymentMethod: 'Net Banking',
    transactionRef: 'NB/260726/4312',
    status: 'Success',
    notes: 'Installment 2 of 12 paid via HDFC Net Banking'
  },
  {
    id: 3,
    paymentId: 'PAY0003',
    loanId: 'LOAN0001',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    installmentNumber: 3,
    amount: 1000,
    paymentDate: '2026-08-27',
    paymentMethod: 'UPI',
    transactionRef: 'UPI/260827/9012',
    status: 'Success',
    notes: 'Installment 3 of 12 paid via PhonePe UPI'
  },
  {
    id: 4,
    paymentId: 'PAY0004',
    loanId: 'LOAN0001',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    installmentNumber: 4,
    amount: 1000,
    paymentDate: '2026-09-20',
    paymentMethod: 'Society Balance',
    transactionRef: 'SOC/260920/1189',
    status: 'Success',
    notes: 'Installment 4 of 12 paid via Society Balance auto-deduct'
  },
  {
    id: 5,
    paymentId: 'PAY0005',
    loanId: 'LOAN0002',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    installmentNumber: 1,
    amount: 5000,
    paymentDate: '2026-08-14',
    paymentMethod: 'UPI',
    transactionRef: 'UPI/260814/5521',
    status: 'Success',
    notes: 'Installment 1 of 12 paid via Paytm UPI'
  },
  {
    id: 6,
    paymentId: 'PAY0006',
    loanId: 'LOAN0002',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    installmentNumber: 2,
    amount: 5000,
    paymentDate: '2026-09-12',
    paymentMethod: 'Net Banking',
    transactionRef: 'NB/260912/7719',
    status: 'Success',
    notes: 'Installment 2 of 12 paid via ICICI Net Banking'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    transactionId: 'TXN0001',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    type: 'credit',
    category: 'contribution',
    amount: 25000,
    description: 'Initial Society Member Contribution / Deposit',
    date: '2026-08-01',
    referenceId: 'REG-SOCITY0001',
    balanceAfter: 25000
  },
  {
    id: 2,
    transactionId: 'TXN0002',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    type: 'credit',
    category: 'contribution',
    amount: 40000,
    description: 'Initial Society Member Contribution / Deposit',
    date: '2026-08-10',
    referenceId: 'REG-SOCITY0002',
    balanceAfter: 40000
  },
  {
    id: 3,
    transactionId: 'TXN0003',
    userId: 'SOCITY0003',
    userName: 'Priya Patel',
    type: 'credit',
    category: 'contribution',
    amount: 15000,
    description: 'Initial Society Member Contribution / Deposit',
    date: '2026-08-15',
    referenceId: 'REG-SOCITY0003',
    balanceAfter: 15000
  },
  {
    id: 4,
    transactionId: 'TXN0004',
    userId: 'SOCITY0004',
    userName: 'Amit Kumar',
    type: 'credit',
    category: 'contribution',
    amount: 30000,
    description: 'Initial Society Member Contribution / Deposit',
    date: '2026-08-20',
    referenceId: 'REG-SOCITY0004',
    balanceAfter: 30000
  },
  {
    id: 5,
    transactionId: 'TXN0005',
    userId: 'SOCITY0005',
    userName: 'Sneha Verma',
    type: 'credit',
    category: 'contribution',
    amount: 15000,
    description: 'Initial Society Member Contribution / Deposit',
    date: '2026-08-25',
    referenceId: 'REG-SOCITY0005',
    balanceAfter: 15000
  },
  {
    id: 6,
    transactionId: 'TXN0006',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    type: 'credit',
    category: 'loan_disbursement',
    amount: 12000,
    description: 'Loan Disbursed - LOAN0001 (Emergency Medical)',
    date: '2026-06-01',
    referenceId: 'LOAN0001',
    balanceAfter: 25000
  },
  {
    id: 7,
    transactionId: 'TXN0007',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    type: 'debit',
    category: 'emi_payment',
    amount: 1000,
    description: 'EMI Payment Month 1/12 for LOAN0001',
    date: '2026-06-25',
    referenceId: 'PAY0001',
    balanceAfter: 25000
  },
  {
    id: 8,
    transactionId: 'TXN0008',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    type: 'debit',
    category: 'emi_payment',
    amount: 1000,
    description: 'EMI Payment Month 2/12 for LOAN0001',
    date: '2026-07-26',
    referenceId: 'PAY0002',
    balanceAfter: 25000
  },
  {
    id: 9,
    transactionId: 'TXN0009',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    type: 'debit',
    category: 'emi_payment',
    amount: 1000,
    description: 'EMI Payment Month 3/12 for LOAN0001',
    date: '2026-08-27',
    referenceId: 'PAY0003',
    balanceAfter: 25000
  },
  {
    id: 10,
    transactionId: 'TXN0010',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    type: 'debit',
    category: 'emi_payment',
    amount: 1000,
    description: 'EMI Payment Month 4/12 for LOAN0001',
    date: '2026-09-20',
    referenceId: 'PAY0004',
    balanceAfter: 25000
  },
  {
    id: 11,
    transactionId: 'TXN0011',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    type: 'credit',
    category: 'loan_disbursement',
    amount: 60000,
    description: 'Loan Disbursed - LOAN0002 (Home Renovation)',
    date: '2026-07-15',
    referenceId: 'LOAN0002',
    balanceAfter: 40000
  },
  {
    id: 12,
    transactionId: 'TXN0012',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    type: 'debit',
    category: 'emi_payment',
    amount: 5000,
    description: 'EMI Payment Month 1/12 for LOAN0002',
    date: '2026-08-14',
    referenceId: 'PAY0005',
    balanceAfter: 40000
  },
  {
    id: 13,
    transactionId: 'TXN0013',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    type: 'debit',
    category: 'emi_payment',
    amount: 5000,
    description: 'EMI Payment Month 2/12 for LOAN0002',
    date: '2026-09-12',
    referenceId: 'PAY0006',
    balanceAfter: 40000
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    type: 'taken_loan',
    title: 'New Loan Taken',
    message: 'SOCITY0001 (Demo User) has taken a loan of ₹12,000 for Emergency Medical Expenses',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    loanId: 'LOAN0001',
    amount: 12000,
    isRead: true,
    createdAt: '2026-06-01',
    link: '/admin/loans/LOAN0001'
  },
  {
    id: 2,
    type: 'installment_paid',
    title: 'Loan Installment Paid',
    message: 'SOCITY0001 paid EMI installment 4/12 (₹1,000) for LOAN0001',
    userId: 'SOCITY0001',
    userName: 'Demo User',
    loanId: 'LOAN0001',
    amount: 1000,
    isRead: false,
    createdAt: '2026-09-20',
    link: '/admin/loans/LOAN0001'
  },
  {
    id: 3,
    type: 'taken_loan',
    title: 'New Loan Taken',
    message: 'SOCITY0002 (Rajesh Sharma) has taken a loan of ₹60,000 for Home Renovation & Repair',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    loanId: 'LOAN0002',
    amount: 60000,
    isRead: true,
    createdAt: '2026-07-15',
    link: '/admin/loans/LOAN0002'
  },
  {
    id: 4,
    type: 'installment_paid',
    title: 'Loan Installment Paid',
    message: 'SOCITY0002 paid EMI installment 2/12 (₹5,000) for LOAN0002',
    userId: 'SOCITY0002',
    userName: 'Rajesh Sharma',
    loanId: 'LOAN0002',
    amount: 5000,
    isRead: false,
    createdAt: '2026-09-12',
    link: '/admin/loans/LOAN0002'
  },
  {
    id: 5,
    type: 'loan_completed',
    title: '🎉 Loan Fully Completed',
    message: 'SOCITY0003 (Priya Patel) has completed all 12 installments for LOAN0003 (₹24,000)',
    userId: 'SOCITY0003',
    userName: 'Priya Patel',
    loanId: 'LOAN0003',
    amount: 24000,
    isRead: false,
    createdAt: '2026-08-31',
    link: '/admin/loans/LOAN0003'
  }
];
