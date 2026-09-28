import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { UserService } from './user.service';
import { Loan, RepaymentInstallment } from '../models/loan.model';
import { Transaction } from '../models/transaction.model';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private storage = inject(LocalStorageService);
  private userService = inject(UserService);

  getLoans$(): Observable<Loan[]> {
    return this.storage.getLoans$();
  }

  getLoans(): Loan[] {
    return this.storage.getLoans();
  }

  getUserLoans$(userId: string): Observable<Loan[]> {
    return this.storage.getLoans$().pipe(
      map(loans => loans.filter(l => l.userId.toUpperCase() === userId.toUpperCase()))
    );
  }

  getUserLoans(userId: string): Loan[] {
    const loans = this.storage.getLoans();
    return loans.filter(l => l.userId.toUpperCase() === userId.toUpperCase());
  }

  getLoanById(loanId: string): Loan | undefined {
    const loans = this.storage.getLoans();
    return loans.find(l => l.loanId.toUpperCase() === loanId.toUpperCase() || l.id?.toString() === loanId);
  }

  calculateEMI(loanAmount: number): number {
    if (!loanAmount || loanAmount <= 0) return 0;
    // Exactly 12 months as per requirements
    return Math.round(loanAmount / 12);
  }

  generateSchedule(loanAmount: number, startDateStr: string): RepaymentInstallment[] {
    const monthlyEMI = this.calculateEMI(loanAmount);
    const schedule: RepaymentInstallment[] = [];
    const baseDate = new Date(startDateStr || new Date());

    let accumulated = 0;
    for (let i = 1; i <= 12; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + i);

      // Handle any rounding difference on the last installment
      let emi = monthlyEMI;
      if (i === 12) {
        emi = loanAmount - accumulated;
      } else {
        accumulated += emi;
      }

      schedule.push({
        installmentNumber: i,
        amount: emi,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'Pending'
      });
    }

    return schedule;
  }

  generateNextLoanId(): string {
    const loans = this.storage.getLoans();
    if (loans.length === 0) return 'LOAN0001';

    let maxNum = 0;
    loans.forEach(l => {
      const match = l.loanId.match(/LOAN(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    return `LOAN${nextNum.toString().padStart(4, '0')}`;
  }

  createLoan(data: {
    userId: string;
    loanAmount: number;
    loanPurpose: string;
    loanDate: string;
  }): { success: boolean; message: string; loan?: Loan } {
    if (data.loanAmount <= 0) {
      return { success: false, message: 'Loan amount must be greater than zero.' };
    }

    const user = this.userService.getUserById(data.userId);
    if (!user) {
      return { success: false, message: 'Invalid user for loan application.' };
    }

    const loans = this.storage.getLoans();
    const nextId = loans.length > 0 ? Math.max(...loans.map(l => l.id || 0)) + 1 : 1;
    const loanId = this.generateNextLoanId();
    const emi = this.calculateEMI(data.loanAmount);
    const schedule = this.generateSchedule(data.loanAmount, data.loanDate);

    const newLoan: Loan = {
      id: nextId,
      loanId: loanId,
      userId: user.userId,
      userName: user.name,
      loanAmount: data.loanAmount,
      monthlyEMI: emi,
      loanPurpose: data.loanPurpose.trim() || 'General Purpose',
      loanDate: data.loanDate,
      status: 'Active',
      totalMonths: 12,
      paidMonths: 0,
      remainingMonths: 12,
      paidAmount: 0,
      pendingAmount: data.loanAmount,
      repaymentSchedule: schedule
    };

    const updatedLoans = [newLoan, ...loans];
    this.storage.saveLoans(updatedLoans);

    // Create loan disbursement transaction
    const txns = this.storage.getTransactions();
    const nextTxnId = txns.length > 0 ? Math.max(...txns.map(t => t.id || 0)) + 1 : 1;
    const newTxn: Transaction = {
      id: nextTxnId,
      transactionId: `TXN${nextTxnId.toString().padStart(4, '0')}`,
      userId: user.userId,
      userName: user.name,
      type: 'credit',
      category: 'loan_disbursement',
      amount: data.loanAmount,
      description: `Loan Disbursed - ${loanId} (${newLoan.loanPurpose})`,
      date: data.loanDate,
      referenceId: loanId,
      balanceAfter: user.totalAmount
    };
    this.storage.saveTransactions([newTxn, ...txns]);

    // Create Admin Notification
    const notifs = this.storage.getNotifications();
    const nextNotifId = notifs.length > 0 ? Math.max(...notifs.map(n => n.id || 0)) + 1 : 1;
    const newNotif: AppNotification = {
      id: nextNotifId,
      type: 'taken_loan',
      title: 'New Loan Taken',
      message: `${user.userId} (${user.name}) has taken a loan of ₹${data.loanAmount.toLocaleString('en-IN')}`,
      userId: user.userId,
      userName: user.name,
      loanId: loanId,
      amount: data.loanAmount,
      isRead: false,
      createdAt: data.loanDate,
      link: `/admin/loans/${loanId}`
    };
    this.storage.saveNotifications([newNotif, ...notifs]);

    return {
      success: true,
      message: `Loan ${loanId} of ₹${data.loanAmount.toLocaleString('en-IN')} approved successfully!`,
      loan: newLoan
    };
  }

  updateLoan(loan: Loan): void {
    const loans = this.storage.getLoans();
    const index = loans.findIndex(l => l.loanId.toUpperCase() === loan.loanId.toUpperCase());
    if (index !== -1) {
      loans[index] = loan;
      this.storage.saveLoans(loans);
    }
  }
}
