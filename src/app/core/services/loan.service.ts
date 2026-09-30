import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, combineLatest, filter, debounceTime } from 'rxjs';
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
  DocumentData
} from 'firebase/firestore';
import { firestoreDb } from '../firebase/firebase.config';
import { listenAsUser } from '../firebase/live-query';
import { AuthService } from './auth.service';
import { Loan, RepaymentInstallment, LOAN_MONTHS, LOAN_INTEREST_RATE, DUE_DAY } from '../models/loan.model';
import { UserService } from './user.service';
import { ToastService } from './toast.service';

const LOAN_STATUS: Record<string, Loan['status']> = { active: 'Active', completed: 'Completed', pending: 'Pending', rejected: 'Rejected' };
const isApprovedLoan = (l: Loan) => l.status === 'Active' || l.status === 'Completed';

/** Cash the society can lend right now: deposits + repayments + late fees − loans given. */
export function societyAvailable(d: DocumentData | undefined): number {
  return Math.max(0, (d?.['totalDeposits'] || 0) + (d?.['totalRepaid'] || 0) + (d?.['totalFees'] || 0) - (d?.['totalDisbursed'] || 0));
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  private loans$ = new BehaviorSubject<Loan[]>([]);
  private isLoaded$ = new BehaviorSubject<boolean>(false);
  private societyRef = doc(firestoreDb, 'counters', 'society');
  private availableFunds$ = new BehaviorSubject<number>(0);

  constructor() {
    this.initLoansListener();
    this.initSocietyFunds();
  }

  private initSocietyFunds(): void {
    listenAsUser(this.auth, () => this.societyRef, docs => this.availableFunds$.next(societyAvailable(docs[0]?.data())));

    // Admin sees every user and loan, so recompute the totals from source data.
    // Backfills existing data and corrects any drift from the increments below.
    let lastWritten = '';
    combineLatest([this.auth.getCurrentUser$(), this.userService.getUsers$(), this.loans$, this.isLoaded$]).pipe(
      filter(([u, users, , loaded]) => u?.role === 'admin' && loaded && users.length > 0),
      debounceTime(2000)
    ).subscribe(([, users, loans]) => {
      const totals = {
        totalDeposits: users.filter(u => u.role !== 'admin').reduce((s, u) => s + (u.totalAmount || 0), 0),
        totalDisbursed: loans.filter(isApprovedLoan).reduce((s, l) => s + (l.loanAmount || 0), 0),
        totalRepaid: loans.filter(isApprovedLoan).reduce((s, l) => s + (l.paidAmount || 0), 0)
      };
      const key = JSON.stringify(totals);
      if (key === lastWritten) return;
      lastWritten = key;
      setDoc(this.societyRef, { ...totals, updatedAt: serverTimestamp() }, { merge: true })
        .catch(err => console.warn('Society totals sync failed:', err));
    });
  }

  getAvailableFunds$(): Observable<number> {
    return this.availableFunds$.asObservable();
  }

  private initLoansListener(): void {
    const loansCol = collection(firestoreDb, 'loans');
    listenAsUser(this.auth, u => u.role === 'admin' ? loansCol : query(loansCol, where('userUid', '==', u.uid)), (docs) => {
      const list: Loan[] = [];
      docs.forEach(docSnap => {
        const d = docSnap.data()!;
        const totalMonths: number = d['totalMonths'] || 12; // loans created before the 10-month rule stay 12
        const installments: RepaymentInstallment[] = (d['repaymentSchedule'] || []).map((inst: any) => ({
          id: inst.id || inst.installmentNo?.toString() || inst.installmentNumber?.toString(),
          installmentNo: inst.installmentNo || inst.installmentNumber || 1,
          installmentNumber: inst.installmentNumber || inst.installmentNo || 1,
          amount: inst.amount || 0,
          dueDate: inst.dueDate?.toDate?.() ? inst.dueDate.toDate().toISOString().split('T')[0] : (inst.dueDate || ''),
          paidDate: inst.paidDate?.toDate?.() ? inst.paidDate.toDate().toISOString().split('T')[0] : (inst.paidDate || null),
          status: (inst.status || 'pending').toLowerCase() === 'paid' ? 'Paid' : 'Pending',
          paymentId: inst.paymentId,
          paymentMethod: inst.paymentMethod,
          transactionRef: inst.transactionRef
        }));

        list.push({
          id: docSnap.id,
          loanId: d['loanId'] || docSnap.id,
          userId: d['userId'] || '',
          userUid: d['userUid'] || '',
          userName: d['userName'] || '',
          loanAmount: d['loanAmount'] || 0,
          totalPayable: d['totalPayable'] || d['loanAmount'] || 0,
          monthlyInstallment: d['monthlyInstallment'] || Math.round((d['loanAmount'] || 0) / totalMonths),
          monthlyEMI: d['monthlyEMI'] || d['monthlyInstallment'] || Math.round((d['loanAmount'] || 0) / totalMonths),
          loanPurpose: d['loanPurpose'] || 'General Purpose',
          loanDate: d['loanDate']?.toDate?.() ? d['loanDate'].toDate().toISOString().split('T')[0] : (d['loanDate'] || ''),
          status: LOAN_STATUS[(d['status'] || 'active').toLowerCase()] || 'Active',
          totalMonths,
          paidMonths: d['paidMonths'] || 0,
          remainingMonths: typeof d['remainingMonths'] === 'number' ? d['remainingMonths'] : (totalMonths - (d['paidMonths'] || 0)),
          paidAmount: d['paidAmount'] || 0,
          pendingAmount: typeof d['pendingAmount'] === 'number' ? d['pendingAmount'] : (d['loanAmount'] || 0),
          createdAt: d['createdAt'],
          repaymentSchedule: installments
        });
      });

      // Sort by creation date descending
      list.sort((a, b) => (b.loanId > a.loanId ? 1 : -1));

      this.loans$.next(list);
      this.isLoaded$.next(true);
    });
  }

  /** Approved loans only (Active / Completed); pending & rejected applications are excluded. */
  getLoans$(): Observable<Loan[]> {
    return this.loans$.pipe(map(list => list.filter(isApprovedLoan)));
  }

  getLoans(): Loan[] {
    return this.loans$.value.filter(isApprovedLoan);
  }

  /** Every loan including Pending / Rejected applications. */
  getAllLoans$(): Observable<Loan[]> {
    return this.loans$.asObservable();
  }

  getUserLoans$(userIdOrUid: string): Observable<Loan[]> {
    const clean = userIdOrUid.trim().toUpperCase();
    return this.loans$.pipe(
      map(loans => loans.filter(l => isApprovedLoan(l) && (l.userId.toUpperCase() === clean || l.userUid === userIdOrUid)))
    );
  }

  getUserLoans(userIdOrUid: string): Loan[] {
    const clean = userIdOrUid.trim().toUpperCase();
    return this.loans$.value.filter(l => l.userId.toUpperCase() === clean || l.userUid === userIdOrUid);
  }

  getLoanById(loanId: string): Loan | undefined {
    const clean = loanId.trim().toUpperCase();
    return this.loans$.value.find(l => l.loanId.toUpperCase() === clean || l.id === loanId);
  }

  calculateTotalPayable(loanAmount: number): number {
    if (!loanAmount || loanAmount <= 0) return 0;
    return Math.round(loanAmount * (1 + LOAN_INTEREST_RATE));
  }

  calculateEMI(loanAmount: number): number {
    return Math.round(this.calculateTotalPayable(loanAmount) / LOAN_MONTHS);
  }

  generateSchedule(loanAmount: number, startDateStr: string): RepaymentInstallment[] {
    const totalPayable = this.calculateTotalPayable(loanAmount);
    const monthlyEMI = this.calculateEMI(loanAmount);
    const schedule: RepaymentInstallment[] = [];
    const baseDate = new Date(startDateStr || new Date());

    let accumulated = 0;
    for (let i = 1; i <= LOAN_MONTHS; i++) {
      // Fixed due date: the 15th of each following month
      const due = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, DUE_DAY);
      const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(DUE_DAY).padStart(2, '0')}`;

      // Handle any rounding difference on the last installment
      let emi = monthlyEMI;
      if (i === LOAN_MONTHS) {
        emi = totalPayable - accumulated;
      } else {
        accumulated += emi;
      }

      schedule.push({
        id: i.toString(),
        installmentNo: i,
        installmentNumber: i,
        amount: emi,
        dueDate,
        status: 'Pending',
        paidDate: null
      });
    }

    return schedule;
  }

  /**
   * Generates next sequential LOAN ID (e.g. LOAN0001, LOAN0002) using Firestore transaction.
   */
  async getNextSequentialLoanId(): Promise<string> {
    const counterRef = doc(firestoreDb, 'counters', 'loans');

    return await runTransaction(firestoreDb, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let lastNumber = 0;

      if (counterDoc.exists()) {
        lastNumber = counterDoc.data()['lastNumber'] || 0;
      } else {
        // Fallback to highest existing loan ID
        this.loans$.value.forEach(l => {
          const match = l.loanId.match(/LOAN(\d+)/i);
          if (match && match[1]) {
            const n = parseInt(match[1], 10);
            if (n > lastNumber) lastNumber = n;
          }
        });
      }

      const newNumber = lastNumber + 1;
      transaction.set(counterRef, { lastNumber: newNumber, updatedAt: serverTimestamp() }, { merge: true });
      return `LOAN${newNumber.toString().padStart(4, '0')}`;
    });
  }

  /**
   * Member applies for a loan: saved as 'pending' and the admin is notified.
   * Nothing is disbursed until the admin approves it (see approveLoan).
   */
  async createLoan(data: {
    userId: string;
    userUid?: string;
    userName?: string;
    loanAmount: number;
    loanPurpose: string;
    loanDate: string;
  }): Promise<{ success: boolean; message: string; loan?: Loan }> {
    if (data.loanAmount <= 0) {
      return { success: false, message: 'Loan amount must be greater than zero.' };
    }

    const user = this.userService.getUserById(data.userId) || (data.userUid ? this.userService.getUserByUid(data.userUid) : undefined);
    const userId = user ? user.userId : data.userId;
    const userUid = user ? user.uid : (data.userUid || '');
    const userName = user ? user.name : (data.userName || 'Member');

    if (this.loans$.value.some(l => l.status === 'Pending' && (l.userUid === userUid || l.userId === userId))) {
      return { success: false, message: 'You already have a loan application waiting for admin approval.' };
    }
    if (data.loanAmount > this.availableFunds$.value) {
      return { success: false, message: `Society funds are not enough for this loan. Maximum available: ₹${this.availableFunds$.value.toLocaleString('en-IN')}.` };
    }

    try {
      const loanId = await this.getNextSequentialLoanId();
      const emi = this.calculateEMI(data.loanAmount);
      const today = data.loanDate || new Date().toISOString().split('T')[0];

      const loanData = {
        loanId: loanId,
        userId: userId,
        userUid: userUid,
        userName: userName,
        loanAmount: data.loanAmount,
        totalPayable: this.calculateTotalPayable(data.loanAmount),
        monthlyInstallment: emi,
        monthlyEMI: emi,
        totalMonths: LOAN_MONTHS,
        paidMonths: 0,
        remainingMonths: LOAN_MONTHS,
        paidAmount: 0,
        pendingAmount: this.calculateTotalPayable(data.loanAmount),
        loanPurpose: data.loanPurpose.trim() || 'General Emergency Purpose',
        loanDate: today,
        status: 'pending',
        createdAt: serverTimestamp(),
        repaymentSchedule: this.generateSchedule(data.loanAmount, today)
      };

      await setDoc(doc(firestoreDb, 'loans', loanId), loanData);

      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'loan_request',
        title: 'Loan Approval Needed',
        message: `${userId} (${userName}) applied for a loan of ₹${data.loanAmount.toLocaleString('en-IN')} (${loanData.loanPurpose}). Please approve or reject.`,
        userId: userId,
        userUid: userUid,
        userName: userName,
        loanId: loanId,
        amount: data.loanAmount,
        isRead: false,
        createdAt: serverTimestamp(),
        link: '/admin/loans'
      });

      return {
        success: true,
        message: `Loan application ${loanId} of ₹${data.loanAmount.toLocaleString('en-IN')} sent to admin for approval.`,
        loan: { id: loanId, ...loanData, status: 'Pending' }
      };
    } catch (err: any) {
      console.error('Failed to create loan:', err);
      return { success: false, message: err.message || 'Failed to submit loan application.' };
    }
  }

  /**
   * Admin approves a pending loan: reserves society funds, starts the 10-month schedule from today
   * (first EMI on the 15th of next month), records the disbursement and notifies the member.
   */
  async approveLoan(loanId: string): Promise<{ success: boolean; message: string }> {
    const loanRef = doc(firestoreDb, 'loans', loanId);
    const today = new Date().toISOString().split('T')[0];
    let loan: any = null;
    let schedule: RepaymentInstallment[] = [];

    try {
      await runTransaction(firestoreDb, async (tx) => {
        const loanSnap = await tx.get(loanRef);
        const fundSnap = await tx.get(this.societyRef);
        loan = loanSnap.data();
        if (!loan || loan['status'] !== 'pending') {
          throw new Error('This loan application was already processed.');
        }
        const available = societyAvailable(fundSnap.data());
        if (loan['loanAmount'] > available) {
          throw new Error(`Society funds are not enough. Available: ₹${available.toLocaleString('en-IN')}.`);
        }
        schedule = this.generateSchedule(loan['loanAmount'], today);
        tx.update(loanRef, { status: 'active', loanDate: today, repaymentSchedule: schedule, approvedAt: serverTimestamp() });
        tx.set(this.societyRef, { totalDisbursed: (fundSnap.data()?.['totalDisbursed'] || 0) + loan['loanAmount'] }, { merge: true });
      });

      for (const inst of schedule) {
        setDoc(doc(firestoreDb, `loans/${loanId}/installments`, String(inst.installmentNumber)), {
          installmentNo: inst.installmentNumber,
          amount: inst.amount,
          status: 'pending',
          dueDate: inst.dueDate,
          paidDate: null,
          createdAt: serverTimestamp()
        }).catch(err => console.warn('Installment write warning:', err));
      }

      await addDoc(collection(firestoreDb, 'transactions'), {
        userId: loan['userId'],
        userUid: loan['userUid'],
        userName: loan['userName'],
        type: 'loan',
        category: 'loan_disbursement',
        amount: loan['loanAmount'],
        description: `Loan Disbursement - ${loanId} (${loan['loanPurpose']})`,
        date: today,
        referenceId: loanId,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'taken_loan',
        title: 'Loan Approved',
        message: `Loan ${loanId} of ₹${loan['loanAmount'].toLocaleString('en-IN')} for ${loan['userName']} (${loan['userId']}) is approved. First EMI due on ${schedule[0]?.dueDate}.`,
        userId: loan['userId'],
        userUid: loan['userUid'],
        userName: loan['userName'],
        loanId,
        amount: loan['loanAmount'],
        isRead: false,
        createdAt: serverTimestamp(),
        link: `/admin/loans/${loanId}`
      });

      return { success: true, message: `Loan ${loanId} approved for ${loan['userName']}.` };
    } catch (err: any) {
      console.error('Loan approval failed:', err);
      return { success: false, message: err.message || 'Failed to approve loan.' };
    }
  }

  /** Admin rejects a pending loan application; nothing is disbursed. */
  async rejectLoan(loanId: string): Promise<{ success: boolean; message: string }> {
    const loan = this.loans$.value.find(l => l.loanId === loanId);
    if (!loan || loan.status !== 'Pending') {
      return { success: false, message: 'This loan application was already processed.' };
    }
    try {
      await updateDoc(doc(firestoreDb, 'loans', loanId), { status: 'rejected', updatedAt: serverTimestamp() });
      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'loan_rejected',
        title: 'Loan Application Rejected',
        message: `Loan application ${loanId} of ₹${loan.loanAmount.toLocaleString('en-IN')} was rejected by admin. Please contact the society.`,
        userId: loan.userId,
        userUid: loan.userUid,
        userName: loan.userName,
        loanId,
        amount: loan.loanAmount,
        isRead: false,
        createdAt: serverTimestamp(),
        link: '/user/loans'
      });
      return { success: true, message: `Loan application ${loanId} rejected.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reject loan.' };
    }
  }

  async updateLoan(loan: Loan): Promise<void> {
    try {
      const loanRef = doc(firestoreDb, 'loans', loan.loanId);
      await updateDoc(loanRef, {
        paidMonths: loan.paidMonths,
        remainingMonths: loan.remainingMonths,
        paidAmount: loan.paidAmount,
        pendingAmount: loan.pendingAmount,
        status: loan.status.toLowerCase(),
        repaymentSchedule: loan.repaymentSchedule,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to update loan:', err);
    }
  }
}
