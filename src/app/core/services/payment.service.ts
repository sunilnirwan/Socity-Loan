import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { LoanService } from './loan.service';
import { Payment } from '../models/payment.model';
import { Transaction } from '../models/transaction.model';
import { AppNotification } from '../models/notification.model';
import { Loan } from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private storage = inject(LocalStorageService);
  private loanService = inject(LoanService);

  getPayments$(): Observable<Payment[]> {
    return this.storage.getPayments$();
  }

  getPayments(): Payment[] {
    return this.storage.getPayments();
  }

  getLoanPayments(loanId: string): Payment[] {
    return this.storage.getPayments().filter(p => p.loanId.toUpperCase() === loanId.toUpperCase());
  }

  getUserPayments$(userId: string): Observable<Payment[]> {
    return this.storage.getPayments$().pipe(
      map(payments => payments.filter(p => p.userId.toUpperCase() === userId.toUpperCase()))
    );
  }

  generateNextPaymentId(): string {
    const payments = this.storage.getPayments();
    if (payments.length === 0) return 'PAY0001';

    let maxNum = 0;
    payments.forEach(p => {
      const match = p.paymentId.match(/PAY(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    return `PAY${nextNum.toString().padStart(4, '0')}`;
  }

  makePayment(data: {
    loanId: string;
    paymentMethod: 'UPI' | 'Net Banking' | 'Debit Card' | 'Society Balance' | 'Cash';
    transactionRef?: string;
    notes?: string;
    paymentDate?: string;
  }): { success: boolean; message: string; payment?: Payment; updatedLoan?: Loan } {
    const loan = this.loanService.getLoanById(data.loanId);
    if (!loan) {
      return { success: false, message: 'Loan not found.' };
    }

    if (loan.status === 'Completed' || loan.paidMonths >= 12 || loan.pendingAmount <= 0) {
      return { success: false, message: 'This loan is already completed. No further payments can be made.' };
    }

    // Find next pending installment
    const nextInstallment = loan.repaymentSchedule.find(inst => inst.status === 'Pending');
    if (!nextInstallment) {
      return { success: false, message: 'All 12 installments have already been paid.' };
    }

    const today = data.paymentDate || new Date().toISOString().split('T')[0];
    const paymentId = this.generateNextPaymentId();
    const txnRef = data.transactionRef || `${data.paymentMethod.replace(/\s+/g, '')}/${Date.now().toString().slice(-6)}`;
    const paymentAmount = nextInstallment.amount;

    // Update Installment in schedule
    nextInstallment.status = 'Paid';
    nextInstallment.paidDate = today;
    nextInstallment.paymentId = paymentId;
    nextInstallment.paymentMethod = data.paymentMethod;
    nextInstallment.transactionRef = txnRef;

    // Update Loan progress
    loan.paidMonths += 1;
    loan.remainingMonths = Math.max(0, 12 - loan.paidMonths);
    loan.paidAmount += paymentAmount;
    loan.pendingAmount = Math.max(0, loan.loanAmount - loan.paidAmount);

    let isNowCompleted = false;
    if (loan.paidMonths >= 12 || loan.pendingAmount === 0) {
      loan.status = 'Completed';
      loan.pendingAmount = 0;
      loan.remainingMonths = 0;
      isNowCompleted = true;
    }

    // Save updated Loan
    this.loanService.updateLoan(loan);

    // Create Payment Record
    const payments = this.storage.getPayments();
    const nextPaymentDbId = payments.length > 0 ? Math.max(...payments.map(p => p.id || 0)) + 1 : 1;

    const newPayment: Payment = {
      id: nextPaymentDbId,
      paymentId: paymentId,
      loanId: loan.loanId,
      userId: loan.userId,
      userName: loan.userName,
      installmentNumber: nextInstallment.installmentNumber,
      amount: paymentAmount,
      paymentDate: today,
      paymentMethod: data.paymentMethod,
      transactionRef: txnRef,
      status: 'Success',
      notes: data.notes || `Installment ${nextInstallment.installmentNumber} of 12 paid via ${data.paymentMethod}`
    };

    this.storage.savePayments([newPayment, ...payments]);

    // Create Transaction Record
    const txns = this.storage.getTransactions();
    const nextTxnId = txns.length > 0 ? Math.max(...txns.map(t => t.id || 0)) + 1 : 1;
    const newTxn: Transaction = {
      id: nextTxnId,
      transactionId: `TXN${nextTxnId.toString().padStart(4, '0')}`,
      userId: loan.userId,
      userName: loan.userName,
      type: 'debit',
      category: 'emi_payment',
      amount: paymentAmount,
      description: `EMI Payment Month ${nextInstallment.installmentNumber}/12 for ${loan.loanId}`,
      date: today,
      referenceId: paymentId
    };
    this.storage.saveTransactions([newTxn, ...txns]);

    // Create Admin Notifications
    const notifs = this.storage.getNotifications();
    const nextNotifId = notifs.length > 0 ? Math.max(...notifs.map(n => n.id || 0)) + 1 : 1;

    const emiNotif: AppNotification = {
      id: nextNotifId,
      type: 'installment_paid',
      title: 'Loan Installment Paid',
      message: `${loan.userId} (${loan.userName}) paid EMI #${nextInstallment.installmentNumber} (₹${paymentAmount.toLocaleString('en-IN')}) for ${loan.loanId}`,
      userId: loan.userId,
      userName: loan.userName,
      loanId: loan.loanId,
      amount: paymentAmount,
      isRead: false,
      createdAt: today,
      link: `/admin/loans/${loan.loanId}`
    };

    const newNotifs = [emiNotif, ...notifs];

    if (isNowCompleted) {
      const completedNotif: AppNotification = {
        id: nextNotifId + 1,
        type: 'loan_completed',
        title: '🎉 Loan Fully Completed!',
        message: `${loan.userId} (${loan.userName}) has completed all 12 installments for loan ${loan.loanId} (₹${loan.loanAmount.toLocaleString('en-IN')})!`,
        userId: loan.userId,
        userName: loan.userName,
        loanId: loan.loanId,
        amount: loan.loanAmount,
        isRead: false,
        createdAt: today,
        link: `/admin/loans/${loan.loanId}`
      };
      newNotifs.unshift(completedNotif);
    }

    this.storage.saveNotifications(newNotifs);

    return {
      success: true,
      message: isNowCompleted
        ? `Installment #${nextInstallment.installmentNumber} paid successfully. Congratulations! Loan ${loan.loanId} is now FULLY COMPLETED!`
        : `Installment #${nextInstallment.installmentNumber} of ₹${paymentAmount.toLocaleString('en-IN')} paid successfully!`,
      payment: newPayment,
      updatedLoan: loan
    };
  }
}
