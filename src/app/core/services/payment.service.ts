import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  addDoc,
  increment
} from 'firebase/firestore';
import { firestoreDb } from '../firebase/firebase.config';
import { listenAsUser } from '../firebase/live-query';
import { AuthService } from './auth.service';
import { LoanService } from './loan.service';
import { Payment } from '../models/payment.model';
import { Loan, earlySettlementAmount, depositFor } from '../models/loan.model';
import { UserService } from './user.service';
import { ToastService } from './toast.service';

const isApproved = (p: Payment) => (p.status || 'Success').toLowerCase() === 'success';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private auth = inject(AuthService);
  private loanService = inject(LoanService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  private payments$ = new BehaviorSubject<Payment[]>([]);
  private isLoaded$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initPaymentsListener();
  }

  private initPaymentsListener(): void {
    const paymentsCol = collection(firestoreDb, 'payments');
    listenAsUser(this.auth, u => u.role === 'admin' ? paymentsCol : query(paymentsCol, where('userUid', '==', u.uid)), (docs) => {
      const list: Payment[] = [];
      docs.forEach(docSnap => {
        const d = docSnap.data()!;
        list.push({
          id: docSnap.id,
          paymentId: d['paymentId'] || docSnap.id,
          loanId: d['loanId'] || '',
          userId: d['userId'] || '',
          userUid: d['userUid'] || '',
          userName: d['userName'] || '',
          installmentNo: d['installmentNo'] || d['installmentNumber'] || 1,
          installmentNumber: d['installmentNumber'] || d['installmentNo'] || 1,
          amount: d['amount'] || 0,
          depositAmount: d['depositAmount'] || 0,
          paymentDate: d['paymentDate']?.toDate?.() ? d['paymentDate'].toDate().toISOString().split('T')[0] : (d['paymentDate'] || ''),
          paymentMethod: d['paymentMethod'] || 'UPI',
          transactionRef: d['transactionRef'] || '',
          status: d['status'] || 'Success',
          notes: d['notes'] || '',
          createdAt: d['createdAt']
        });
      });

      // Sort by paymentDate descending
      list.sort((a, b) => (b.paymentId > a.paymentId ? 1 : -1));

      this.payments$.next(list);
      this.isLoaded$.next(true);
    });
  }

  /** Approved payments only (pending / rejected requests are excluded). */
  getPayments$(): Observable<Payment[]> {
    return this.payments$.pipe(map(list => list.filter(isApproved)));
  }

  getPayments(): Payment[] {
    return this.payments$.value.filter(isApproved);
  }

  getLoanPayments(loanId: string): Payment[] {
    const clean = loanId.trim().toUpperCase();
    return this.getPayments().filter(p => p.loanId.toUpperCase() === clean);
  }

  /** Every payment including Pending / Rejected requests. */
  getAllPayments$(): Observable<Payment[]> {
    return this.payments$.asObservable();
  }

  /** Any payment (including Pending / Rejected requests) by its Firestore doc id. */
  getPaymentByDocId(id: string): Payment | undefined {
    return this.payments$.value.find(p => p.id === id);
  }

  getUserPayments$(userIdOrUid: string): Observable<Payment[]> {
    const clean = userIdOrUid.trim().toUpperCase();
    return this.payments$.pipe(
      map(payments => payments.filter(p => p.userId.toUpperCase() === clean || p.userUid === userIdOrUid))
    );
  }

  /**
   * Generates next sequential Payment ID using Firestore transaction.
   */
  async getNextSequentialPaymentId(): Promise<string> {
    const counterRef = doc(firestoreDb, 'counters', 'payments');

    return await runTransaction(firestoreDb, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let lastNumber = 0;

      if (counterDoc.exists()) {
        lastNumber = counterDoc.data()['lastNumber'] || 0;
      } else {
        this.payments$.value.forEach(p => {
          const match = p.paymentId.match(/PAY(\d+)/i);
          if (match && match[1]) {
            const n = parseInt(match[1], 10);
            if (n > lastNumber) lastNumber = n;
          }
        });
      }

      const newNumber = lastNumber + 1;
      transaction.set(counterRef, { lastNumber: newNumber, updatedAt: serverTimestamp() }, { merge: true });
      return `PAY${newNumber.toString().padStart(4, '0')}`;
    });
  }

  /**
   * Member submits an EMI + deposit payment. Nothing is credited until the admin approves it.
   */
  async requestPayment(data: {
    loanId: string;
    paymentMethod: 'UPI' | 'Net Banking' | 'Debit Card' | 'Society Balance' | 'Cash';
    transactionRef?: string;
    notes?: string;
    paymentDate?: string;
  }): Promise<{ success: boolean; message: string }> {
    const loanId = data.loanId.trim();
    const loan = this.loanService.getLoanById(loanId);
    if (!loan) {
      return { success: false, message: 'Loan record not found.' };
    }
    if (this.payments$.value.some(p => p.loanId === loanId && p.status === 'Pending')) {
      return { success: false, message: 'A payment for this loan is already waiting for admin approval.' };
    }
    const inst = (loan.repaymentSchedule || []).find(i => (i.status || '').toLowerCase() === 'pending');
    if (!inst) {
      return { success: false, message: 'All installments have already been paid for this loan.' };
    }

    try {
      const installmentNo = inst.installmentNumber || inst.installmentNo || 1;
      const deposit = depositFor(this.userService.getUserByUid(loan.userUid || '') || this.userService.getUserById(loan.userId));
      const total = inst.amount + deposit;
      const paymentId = await this.getNextSequentialPaymentId();
      const payRef = await addDoc(collection(firestoreDb, 'payments'), {
        paymentId,
        loanId,
        userId: loan.userId,
        userUid: loan.userUid,
        userName: loan.userName,
        installmentNo,
        installmentNumber: installmentNo,
        amount: inst.amount,
        depositAmount: deposit,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef || '',
        notes: data.notes || '',
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'payment_request',
        title: 'Payment Approval Needed',
        message: `${loan.userId} (${loan.userName}) paid ₹${total.toLocaleString('en-IN')} (EMI #${installmentNo} ₹${inst.amount.toLocaleString('en-IN')} + deposit ₹${deposit.toLocaleString('en-IN')}) for ${loanId} via ${data.paymentMethod}. Please verify and approve.`,
        userId: loan.userId,
        userUid: loan.userUid,
        userName: loan.userName,
        loanId,
        amount: total,
        paymentDocId: payRef.id,
        isRead: false,
        createdAt: serverTimestamp(),
        link: '/admin/notifications'
      });

      return { success: true, message: `Payment of ₹${total.toLocaleString('en-IN')} sent to admin for approval.` };
    } catch (err: any) {
      console.error('Payment request failed:', err);
      return { success: false, message: err.message || 'Payment request failed. Please try again.' };
    }
  }

  /**
   * Admin clears (forecloses) a loan early: remaining principal + 3 months' interest is collected
   * (rest of the interest is waived), the loan is marked completed, and the member can take a new loan.
   */
  async settleLoan(loanId: string): Promise<{ success: boolean; message: string }> {
    const cleanId = loanId.trim();
    if (this.payments$.value.some(p => p.loanId === cleanId && p.status === 'Pending')) {
      return { success: false, message: 'This loan has a payment waiting for approval. Approve or reject it first.' };
    }
    const loanRef = doc(firestoreDb, 'loans', cleanId);
    const today = new Date().toISOString().split('T')[0];

    try {
      const paymentId = await this.getNextSequentialPaymentId();
      let settled = 0;
      let waived = 0;
      let paidInstallments: number[] = [];
      let loan: any = null;

      await runTransaction(firestoreDb, async (transaction) => {
        const loanDoc = await transaction.get(loanRef);
        if (!loanDoc.exists()) throw new Error('Loan record not found.');
        loan = loanDoc.data();
        if (loan['status'] === 'completed' || (loan['pendingAmount'] || 0) <= 0) {
          throw new Error('This loan is already completed.');
        }

        const totalMonths: number = loan['totalMonths'] || 12;
        settled = earlySettlementAmount({
          loanAmount: loan['loanAmount'] || 0,
          totalPayable: loan['totalPayable'],
          totalMonths,
          paidMonths: loan['paidMonths'] || 0,
          pendingAmount: loan['pendingAmount']
        });
        waived = loan['pendingAmount'] - settled;
        const schedule: any[] = (loan['repaymentSchedule'] || []).map((inst: any) => {
          if ((inst.status || '').toLowerCase() === 'paid') return inst;
          paidInstallments.push(inst.installmentNo || inst.installmentNumber);
          return { ...inst, status: 'Paid', paidDate: today, paymentId, paymentMethod: 'Loan Clearance' };
        });

        transaction.update(loanRef, {
          paidMonths: totalMonths,
          remainingMonths: 0,
          paidAmount: (loan['paidAmount'] || 0) + settled,
          pendingAmount: 0,
          status: 'completed',
          repaymentSchedule: schedule,
          settledEarly: true,
          interestWaived: waived,
          updatedAt: serverTimestamp()
        });
        transaction.set(doc(firestoreDb, 'counters', 'society'), { totalRepaid: increment(settled) }, { merge: true });
        transaction.set(doc(collection(firestoreDb, 'payments')), {
          paymentId,
          loanId: cleanId,
          userId: loan['userId'],
          userUid: loan['userUid'],
          userName: loan['userName'],
          installmentNo: paidInstallments[0] || totalMonths,
          installmentNumber: paidInstallments[0] || totalMonths,
          amount: settled,
          depositAmount: 0,
          paymentDate: today,
          paymentMethod: 'Loan Clearance',
          transactionRef: `CLEAR/${cleanId}`,
          status: 'Success',
          notes: `Early clearance of EMI #${paidInstallments.join(', #')} (principal + 3 months interest; ₹${waived.toLocaleString('en-IN')} interest waived)`,
          createdAt: serverTimestamp()
        });
      });

      for (const no of paidInstallments) {
        setDoc(doc(firestoreDb, `loans/${cleanId}/installments`, String(no)),
          { status: 'paid', paidDate: today, paymentId, updatedAt: serverTimestamp() }, { merge: true })
          .catch(err => console.warn('Subcollection update warning:', err));
      }

      await addDoc(collection(firestoreDb, 'transactions'), {
        userId: loan['userId'],
        userUid: loan['userUid'],
        userName: loan['userName'],
        type: 'payment',
        category: 'loan_settlement',
        amount: settled,
        description: `Loan ${cleanId} cleared early — ${paidInstallments.length} EMI(s), ₹${waived.toLocaleString('en-IN')} interest waived`,
        date: today,
        referenceId: paymentId,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'loan_completed',
        title: '🎉 Loan Cleared',
        message: `Loan ${cleanId} of ${loan['userName']} (${loan['userId']}) was cleared with an advance payment of ₹${settled.toLocaleString('en-IN')}. A new loan can now be taken.`,
        userId: loan['userId'],
        userUid: loan['userUid'],
        userName: loan['userName'],
        loanId: cleanId,
        amount: settled,
        isRead: false,
        createdAt: serverTimestamp(),
        link: `/admin/loans/${cleanId}`
      });

      return { success: true, message: `Loan ${cleanId} cleared. ₹${settled.toLocaleString('en-IN')} received (₹${waived.toLocaleString('en-IN')} interest waived).` };
    } catch (err: any) {
      console.error('Loan clearance failed:', err);
      return { success: false, message: err.message || 'Failed to clear loan.' };
    }
  }

  /** Admin rejects a pending payment request; nothing is credited. */
  async rejectPayment(paymentDocId: string): Promise<{ success: boolean; message: string }> {
    const p = this.getPaymentByDocId(paymentDocId);
    if (!p || p.status !== 'Pending') {
      return { success: false, message: 'This payment request was already processed.' };
    }
    try {
      await updateDoc(doc(firestoreDb, 'payments', paymentDocId), { status: 'Rejected', updatedAt: serverTimestamp() });
      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: `Your payment of ₹${(p.amount + (p.depositAmount || 0)).toLocaleString('en-IN')} for ${p.loanId} (EMI #${p.installmentNumber}) was rejected by admin. Please contact the society.`,
        userId: p.userId,
        userUid: p.userUid,
        userName: p.userName,
        loanId: p.loanId,
        amount: p.amount + (p.depositAmount || 0),
        isRead: false,
        createdAt: serverTimestamp(),
        link: '/user/payments'
      });
      return { success: true, message: 'Payment request rejected.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reject payment.' };
    }
  }

  /**
   * Admin approves a member's payment request. Processes installment repayment atomically via Firestore transaction:
   * 1. Validates loan exists, not completed, has pending installments.
   * 2. Finds next pending installment.
   * 3. Updates installment status to 'Paid', sets paidDate, paymentId.
   * 4. Updates loan: paidMonths + 1, remainingMonths - 1, paidAmount + installment amount, pendingAmount - installment amount.
   * 5. If paidMonths === 12: sets loan status = 'Completed', pendingAmount = 0.
   * 6. Creates `payments` document.
   * 7. Creates `transactions` document (type: 'payment').
   * 8. Creates notifications: 'installment_paid' and if completed: 'loan_completed'.
   */
  async approvePayment(paymentDocId: string): Promise<{ success: boolean; message: string; payment?: Payment; updatedLoan?: Loan }> {
    const request = this.getPaymentByDocId(paymentDocId);
    if (!request) {
      return { success: false, message: 'Payment request not found.' };
    }
    const payRef = doc(firestoreDb, 'payments', paymentDocId);
    const data = {
      loanId: request.loanId,
      paymentMethod: request.paymentMethod || 'UPI',
      transactionRef: request.transactionRef,
      notes: request.notes,
      paymentDate: request.paymentDate
    };
    const loanRef = doc(firestoreDb, 'loans', data.loanId.trim());

    try {
      const today = data.paymentDate || new Date().toISOString().split('T')[0];
      const paymentId = request.paymentId;

      let targetInstallmentNo = 1;
      let installmentAmount = 0;
      let newPaidMonths = 0;
      let newRemainingMonths = 12;
      let newPaidAmount = 0;
      let newPendingAmount = 0;
      let isCompleted = false;
      let updatedSchedule: any[] = [];
      let loanSnapshotData: any = null;
      let totalMonthsForLoan = 12;
      let newMemberBalance = 0;
      let depositAmount = 0;

      // Execute atomic transaction for loan and installment update
      await runTransaction(firestoreDb, async (transaction) => {
        const payDoc = await transaction.get(payRef);
        if (payDoc.data()?.['status'] !== 'Pending') {
          throw new Error('This payment request was already processed.');
        }
        const loanDoc = await transaction.get(loanRef);
        if (!loanDoc.exists()) {
          throw new Error('Loan record not found in society database.');
        }

        const loan = loanDoc.data();
        loanSnapshotData = loan;

        // Monthly ₹500 deposit is paid together with the EMI and credited to the member's balance
        const memberRef = doc(firestoreDb, 'users', loan['userUid']);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('Member record not found for this loan.');
        }
        depositAmount = depositFor(memberDoc.data());
        newMemberBalance = (memberDoc.data()['totalAmount'] || 0) + depositAmount;

        const totalMonths: number = loan['totalMonths'] || 12;
        totalMonthsForLoan = totalMonths;
        if (loan['status'] === 'completed' || loan['paidMonths'] >= totalMonths || loan['pendingAmount'] <= 0) {
          throw new Error('This loan is already completed. No further payments are permitted.');
        }

        const schedule: any[] = loan['repaymentSchedule'] || [];
        const nextInstIndex = schedule.findIndex(inst => (inst.status || '').toLowerCase() === 'pending');

        if (nextInstIndex === -1) {
          throw new Error(`All ${totalMonths} installments have already been satisfied.`);
        }

        const inst = schedule[nextInstIndex];
        targetInstallmentNo = inst.installmentNo || inst.installmentNumber || (nextInstIndex + 1);
        installmentAmount = inst.amount || Math.round((loan['totalPayable'] || loan['loanAmount']) / totalMonths);

        // Update installment
        inst.status = 'Paid';
        inst.paidDate = today;
        inst.paymentId = paymentId;
        inst.paymentMethod = data.paymentMethod;
        inst.transactionRef = data.transactionRef || `${data.paymentMethod}/${Date.now().toString().slice(-6)}`;

        // Calculate updated loan metrics
        newPaidMonths = (loan['paidMonths'] || 0) + 1;
        newRemainingMonths = Math.max(0, totalMonths - newPaidMonths);
        newPaidAmount = (loan['paidAmount'] || 0) + installmentAmount;
        newPendingAmount = Math.max(0, (loan['totalPayable'] || loan['loanAmount'] || 0) - newPaidAmount);

        if (newPaidMonths >= totalMonths || newPendingAmount <= 0) {
          isCompleted = true;
          newPendingAmount = 0;
          newRemainingMonths = 0;
        }

        updatedSchedule = schedule;

        transaction.update(memberRef, { totalAmount: newMemberBalance, updatedAt: serverTimestamp() });
        transaction.set(doc(firestoreDb, 'counters', 'society'), {
          totalRepaid: increment(installmentAmount),
          totalDeposits: increment(depositAmount)
        }, { merge: true });

        transaction.update(payRef, {
          status: 'Success',
          installmentNo: targetInstallmentNo,
          installmentNumber: targetInstallmentNo,
          amount: installmentAmount,
          depositAmount,
          approvedAt: serverTimestamp()
        });

        // Commit update to loan document
        transaction.update(loanRef, {
          paidMonths: newPaidMonths,
          remainingMonths: newRemainingMonths,
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          status: isCompleted ? 'completed' : 'active',
          repaymentSchedule: updatedSchedule,
          updatedAt: serverTimestamp()
        });
      });

      // Update subcollection installment record
      try {
        const instSubDoc = doc(firestoreDb, `loans/${data.loanId.trim()}/installments`, targetInstallmentNo.toString());
        await setDoc(instSubDoc, {
          installmentNo: targetInstallmentNo,
          amount: installmentAmount,
          status: 'paid',
          paidDate: today,
          paymentId: paymentId,
          paymentMethod: data.paymentMethod,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (subErr) {
        console.warn('Subcollection update warning:', subErr);
      }

      // Create Payment Document in `payments`
      const paymentDocData: Payment = {
        id: paymentId,
        paymentId: paymentId,
        loanId: data.loanId.trim(),
        userId: loanSnapshotData['userId'],
        userUid: loanSnapshotData['userUid'],
        userName: loanSnapshotData['userName'],
        installmentNo: targetInstallmentNo,
        installmentNumber: targetInstallmentNo,
        amount: installmentAmount,
        depositAmount,
        paymentDate: today,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef || `${data.paymentMethod}/${Date.now().toString().slice(-6)}`,
        status: 'Success',
        notes: data.notes || `Installment ${targetInstallmentNo} of ${totalMonthsForLoan} paid via ${data.paymentMethod}`
      };

      // Create Transaction Record in `transactions`
      await addDoc(collection(firestoreDb, 'transactions'), {
        userId: loanSnapshotData['userId'],
        userUid: loanSnapshotData['userUid'],
        userName: loanSnapshotData['userName'],
        type: 'payment',
        category: 'emi_payment',
        amount: installmentAmount,
        description: `Loan Installment #${targetInstallmentNo}/${totalMonthsForLoan} for ${data.loanId.trim()} (${data.paymentMethod})`,
        date: today,
        referenceId: paymentId,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(firestoreDb, 'transactions'), {
        userId: loanSnapshotData['userId'],
        userUid: loanSnapshotData['userUid'],
        userName: loanSnapshotData['userName'],
        type: 'credit',
        category: 'contribution',
        amount: depositAmount,
        description: `Monthly deposit (paid with EMI #${targetInstallmentNo} of ${data.loanId.trim()})`,
        date: today,
        referenceId: paymentId,
        balanceAfter: newMemberBalance,
        createdAt: serverTimestamp()
      });

      // Create Notification for Admin & User
      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'installment_paid',
        title: 'Loan Installment Paid',
        message: `${loanSnapshotData['userId']} (${loanSnapshotData['userName']}) paid EMI #${targetInstallmentNo} (₹${installmentAmount.toLocaleString('en-IN')}) for ${data.loanId.trim()}`,
        userId: loanSnapshotData['userId'],
        userUid: loanSnapshotData['userUid'],
        loanId: data.loanId.trim(),
        amount: installmentAmount,
        isRead: false,
        createdAt: serverTimestamp(),
        link: `/admin/loans/${data.loanId.trim()}`
      });

      if (isCompleted) {
        await addDoc(collection(firestoreDb, 'notifications'), {
          type: 'loan_completed',
          title: '🎉 Loan Completed Successfully!',
          message: `Loan ${data.loanId.trim()} for ${loanSnapshotData['userName']} (${loanSnapshotData['userId']}) is now fully paid and closed.`,
          userId: loanSnapshotData['userId'],
          userUid: loanSnapshotData['userUid'],
          loanId: data.loanId.trim(),
          amount: loanSnapshotData['loanAmount'],
          isRead: false,
          createdAt: serverTimestamp(),
          link: `/admin/loans/${data.loanId.trim()}`
        });
      }

      const updatedLoan: Loan = {
        loanId: data.loanId.trim(),
        userId: loanSnapshotData['userId'],
        userUid: loanSnapshotData['userUid'],
        userName: loanSnapshotData['userName'],
        loanAmount: loanSnapshotData['loanAmount'],
        totalPayable: loanSnapshotData['totalPayable'],
        monthlyInstallment: installmentAmount,
        loanPurpose: loanSnapshotData['loanPurpose'],
        loanDate: loanSnapshotData['loanDate'],
        status: isCompleted ? 'Completed' : 'Active',
        totalMonths: totalMonthsForLoan,
        paidMonths: newPaidMonths,
        remainingMonths: newRemainingMonths,
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        repaymentSchedule: updatedSchedule
      };

      return {
        success: true,
        message: isCompleted
          ? `Installment #${targetInstallmentNo} approved. Congratulations! Loan ${data.loanId.trim()} is now completely PAID OFF!`
          : `Approved ₹${(installmentAmount + depositAmount).toLocaleString('en-IN')} (EMI #${targetInstallmentNo} ₹${installmentAmount.toLocaleString('en-IN')} + deposit ₹${depositAmount.toLocaleString('en-IN')}) for ${request.userName}.`,
        payment: paymentDocData,
        updatedLoan
      };
    } catch (err: any) {
      console.error('Payment processing failed:', err);
      return { success: false, message: err.message || 'Payment processing failed. Please try again.' };
    }
  }
}
