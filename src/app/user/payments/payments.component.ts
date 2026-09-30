import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { Loan, RepaymentInstallment, depositFor } from '../../core/models/loan.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Payment } from '../../core/models/payment.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { combineLatest, map, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-user-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, InrCurrencyPipe, EmptyStateComponent],
  template: `
    <div class="page-container" *ngIf="paymentData$ | async as data">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Loan Installment Payments</h1>
          <p class="page-subtitle">Pay your monthly EMIs, track 10-month repayment schedules, and view payment receipts</p>
        </div>
      </div>

      <!-- Active Loans Due for Payment -->
      <div class="active-loans-section" *ngIf="data.activeLoans.length > 0">
        <h2 class="section-title">Active Loans Requiring EMI Payment</h2>
        <div class="due-cards-grid">
          <div *ngFor="let loan of data.activeLoans" class="due-card">
            <div class="due-header">
              <div class="due-loan-meta">
                <span class="due-loan-id">{{ loan.loanId }}</span>
                <span class="due-purpose">{{ loan.loanPurpose }}</span>
              </div>
              <span class="badge-due">Next EMI Due</span>
            </div>

            <!-- Next Installment Details -->
            <div class="next-installment-box" *ngIf="getNextPendingInstallment(loan) as nextInst">
              <div class="inst-row">
                <span class="inst-lbl">Installment:</span>
                <span class="inst-val">Month {{ nextInst.installmentNumber }} of {{ loan.totalMonths }}</span>
              </div>
              <div class="inst-row">
                <span class="inst-lbl">Due Date:</span>
                <span class="inst-val">{{ nextInst.dueDate }}</span>
              </div>
              <div class="inst-row emi-row">
                <span class="inst-lbl">Amount Due:</span>
                <span class="inst-val emi-amount">{{ (nextInst.amount + monthlyDeposit) | inrCurrency }}</span>
              </div>
              <div class="inst-row">
                <span class="inst-lbl">Breakdown:</span>
                <span class="inst-val">{{ nextInst.amount | inrCurrency }} EMI + {{ monthlyDeposit | inrCurrency }} deposit</span>
              </div>
            </div>

            <div class="due-footer">
              <div class="loan-progress-mini">
                <span><b>{{ loan.paidMonths }}/{{ loan.totalMonths }}</b> Paid</span>
                <span>Pending: <b>{{ loan.pendingAmount | inrCurrency }}</b></span>
              </div>
              <span class="badge badge-warning" *ngIf="hasPendingRequest(loan, data.payments)">⏳ Waiting for admin approval</span>
              <button
                *ngIf="!hasPendingRequest(loan, data.payments)"
                class="btn btn-pay-now"
                (click)="openPaymentModal(loan, getNextPendingInstallment(loan))"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Pay Month {{ (loan.paidMonths + 1) }} Installment ({{ ((getNextPendingInstallment(loan)?.amount || 0) + monthlyDeposit) | inrCurrency }})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- If no active loans -->
      <div class="no-dues-card" *ngIf="data.activeLoans.length === 0">
        <div class="no-dues-content">
          <div class="check-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <h3 class="no-dues-title">All Caught Up! No Outstanding EMIs</h3>
            <p class="no-dues-desc">You do not have any pending monthly loan installments due right now.</p>
          </div>
        </div>
        <a routerLink="/user/take-loan" class="btn btn-primary">Apply For Loan</a>
      </div>

      <!-- Payment History Receipts Table -->
      <div class="history-section">
        <h2 class="section-title">Payment Receipts & History</h2>
        <div class="content-card">
          <div class="table-responsive" *ngIf="data.payments.length > 0">
            <table class="receipt-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Loan ID</th>
                  <th>Installment</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Transaction Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of data.payments">
                  <td><span class="code-badge">{{ p.paymentId }}</span></td>
                  <td>
                    <a [routerLink]="['/user/loans', p.loanId]" class="loan-link">{{ p.loanId }}</a>
                  </td>
                  <td>
                    <span class="pill-month">Month {{ p.installmentNumber }}</span>
                  </td>
                  <td><span class="date-cell">{{ p.paymentDate }}</span></td>
                  <td class="font-bold text-success">{{ (p.amount + (p.depositAmount || 0)) | inrCurrency }}</td>
                  <td><span class="cat-pill">{{ p.paymentMethod }}</span></td>
                  <td><span class="ref-text">{{ p.transactionRef }}</span></td>
                  <td><span class="badge" [ngClass]="p.status === 'Pending' ? 'badge-warning' : (p.status === 'Rejected' ? 'badge-danger' : 'badge-success')">{{ p.status === 'Pending' ? 'Awaiting Approval' : (p.status || 'Success') }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <app-empty-state
            *ngIf="data.payments.length === 0"
            title="No payment history yet"
            description="When you pay your monthly loan installments, receipts will be saved here."
          ></app-empty-state>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- MODAL: SIMULATED PAYMENT GATEWAY             -->
      <!-- ============================================ -->
      <div class="modal-backdrop" *ngIf="isPaymentModalOpen()" (click)="closePaymentModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Simulated Payment Gateway</h3>
              <p class="modal-subtitle">Secure Installment Settlement for Loan <b>{{ activeModalLoan()?.loanId }}</b></p>
            </div>
            <button class="btn-close" (click)="closePaymentModal()">✕</button>
          </div>

          <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()" class="modal-form">
            <!-- Installment Summary -->
            <div class="payment-summary-box">
              <div class="p-row">
                <span class="p-lbl">Loan ID:</span>
                <span class="p-val font-bold">{{ activeModalLoan()?.loanId }}</span>
              </div>
              <div class="p-row">
                <span class="p-lbl">Installment:</span>
                <span class="p-val">Month {{ activeModalInstallment()?.installmentNumber }} of {{ activeModalLoan()?.totalMonths }}</span>
              </div>
              <div class="p-row">
                <span class="p-lbl">Due Date:</span>
                <span class="p-val">{{ activeModalInstallment()?.dueDate }}</span>
              </div>
              <div class="p-row highlight-amt">
                <span class="p-lbl">Total Payable ({{ (activeModalInstallment()?.amount || 0) | inrCurrency }} EMI + {{ monthlyDeposit | inrCurrency }} deposit):</span>
                <span class="p-val emi-huge">{{ ((activeModalInstallment()?.amount || 0) + monthlyDeposit) | inrCurrency }}</span>
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="form-group">
              <label class="form-label">Select Payment Method <span class="required">*</span></label>
              <div class="method-options-grid">
                <label class="method-card" [class.selected]="paymentForm.get('paymentMethod')?.value === 'UPI'">
                  <input type="radio" formControlName="paymentMethod" value="UPI" />
                  <div class="method-info">
                    <span class="m-title">UPI Payment</span>
                    <span class="m-sub">GPay, PhonePe, Paytm, BHIM</span>
                  </div>
                </label>

                <label class="method-card" [class.selected]="paymentForm.get('paymentMethod')?.value === 'Net Banking'">
                  <input type="radio" formControlName="paymentMethod" value="Net Banking" />
                  <div class="method-info">
                    <span class="m-title">Net Banking</span>
                    <span class="m-sub">HDFC, ICICI, SBI, Axis</span>
                  </div>
                </label>

                <label class="method-card" [class.selected]="paymentForm.get('paymentMethod')?.value === 'Debit Card'">
                  <input type="radio" formControlName="paymentMethod" value="Debit Card" />
                  <div class="method-info">
                    <span class="m-title">Debit / ATM Card</span>
                    <span class="m-sub">Visa, Mastercard, RuPay</span>
                  </div>
                </label>

                <label class="method-card" [class.selected]="paymentForm.get('paymentMethod')?.value === 'Society Balance'">
                  <input type="radio" formControlName="paymentMethod" value="Society Balance" />
                  <div class="method-info">
                    <span class="m-title">Society Balance</span>
                    <span class="m-sub">Auto-deduct from deposit</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Payment Date -->
            <div class="form-group">
              <label class="form-label">Payment Date</label>
              <input type="date" class="form-control" formControlName="paymentDate" />
            </div>

            <!-- Remarks -->
            <div class="form-group">
              <label class="form-label">Transaction Notes / Remarks</label>
              <input type="text" class="form-control" formControlName="notes" placeholder="Optional reference note" />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closePaymentModal()">Cancel</button>
              <button type="submit" class="btn btn-success" [disabled]="paymentForm.invalid || isSubmitting()">
                <span *ngIf="!isSubmitting()">Confirm & Pay {{ ((activeModalInstallment()?.amount || 0) + monthlyDeposit) | inrCurrency }}</span>
                <span *ngIf="isSubmitting()">Processing Payment...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #172033; margin: 0; }
    .page-subtitle { font-size: 0.88rem; color: #64748B; margin: 4px 0 0; }

    .section-title { font-size: 1.2rem; font-weight: 800; color: #172033; margin: 0 0 16px 0; }

    .due-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .due-card {
      background: #ffffff;
      border: 1.5px solid #BFDBFE;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(49, 85, 200, 0.08);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .due-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .due-loan-meta { display: flex; flex-direction: column; }
    .due-loan-id { font-family: monospace; font-size: 1.15rem; font-weight: 800; color: #3155C8; }
    .due-purpose { font-size: 0.84rem; color: #475569; margin-top: 2px; }
    .badge-due {
      background: #FEF3C7;
      color: #B45309;
      font-size: 0.76rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .next-installment-box {
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .inst-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.86rem; }
    .inst-lbl { color: #64748B; font-weight: 600; }
    .inst-val { color: #1E293B; font-weight: 700; }
    .emi-row { padding-top: 6px; border-top: 1px dashed #BFDBFE; margin-top: 4px; }
    .emi-amount { font-size: 1.25rem; font-weight: 800; color: #16A34A; }

    .due-footer { display: flex; flex-direction: column; gap: 12px; }
    .loan-progress-mini { display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748B; }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
      border: none;
    }
    .btn-pay-now, .btn-success {
      background: #16A34A;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
    }
    .btn-pay-now:hover, .btn-success:hover { background: #15803D; transform: translateY(-1px); }
    .btn-primary { background: #3155C8; color: #ffffff; }
    .btn-secondary { background: #F1F5F9; color: #334155; }

    .no-dues-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      padding: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .no-dues-content { display: flex; align-items: center; gap: 16px; }
    .check-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #DCFCE7;
      color: #16A34A;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .no-dues-title { font-size: 1.15rem; font-weight: 800; color: #172033; margin: 0; }
    .no-dues-desc { font-size: 0.86rem; color: #64748B; margin: 4px 0 0; }

    .content-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .table-responsive { overflow-x: auto; }
    .receipt-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .receipt-table th { background: #F8FAFC; padding: 12px 14px; text-align: left; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; }
    .receipt-table td { padding: 14px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
    .code-badge { font-family: monospace; font-size: 0.82rem; font-weight: 700; color: #334155; }
    .loan-link { font-family: monospace; font-weight: 700; color: #3155C8; text-decoration: none; }
    .pill-month { font-size: 0.8rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    .date-cell { font-size: 0.82rem; color: #64748B; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16A34A !important; }
    .cat-pill { font-size: 0.74rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    .ref-text { font-family: monospace; font-size: 0.76rem; color: #64748B; }
    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-warning { background: #FEF3C7; color: #B45309; }
    .badge-danger { background: #FEE2E2; color: #DC2626; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: 18px;
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .modal-header {
      padding: 20px 24px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .modal-title { font-size: 1.15rem; font-weight: 800; color: #172033; margin: 0; }
    .modal-subtitle { font-size: 0.8rem; color: #64748B; margin: 4px 0 0; }
    .btn-close { background: none; border: none; font-size: 1.2rem; color: #94A3B8; cursor: pointer; }
    .modal-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }

    .payment-summary-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .p-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.86rem; }
    .p-lbl { color: #64748B; }
    .highlight-amt { padding-top: 8px; border-top: 1px solid #E2E8F0; margin-top: 4px; }
    .emi-huge { font-size: 1.4rem; font-weight: 800; color: #16A34A; }

    .method-options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 6px;
    }
    .method-card {
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .method-card input { margin-top: 3px; }
    .method-card.selected {
      border-color: #16A34A;
      background: #F0FDF4;
    }
    .method-info { display: flex; flex-direction: column; }
    .m-title { font-size: 0.84rem; font-weight: 700; color: #172033; }
    .m-sub { font-size: 0.72rem; color: #64748B; }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 0.84rem; font-weight: 600; color: #334155; }
    .required { color: #DC2626; }
    .form-control { width: 100%; height: 42px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #CBD5E1; font-size: 0.9rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `]
})
export class UserPaymentsComponent implements OnInit {
  private authService = inject(AuthService);
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.getCurrentUser();

  isPaymentModalOpen = signal<boolean>(false);
  activeModalLoan = signal<Loan | null>(null);
  activeModalInstallment = signal<RepaymentInstallment | null>(null);
  isSubmitting = signal<boolean>(false);

  paymentForm: FormGroup = this.fb.group({
    paymentMethod: ['UPI', [Validators.required]],
    paymentDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    notes: ['']
  });

  paymentData$ = this.authService.getCurrentUser$().pipe(
    switchMap(user => {
      if (!user) return of({ activeLoans: [], payments: [] });
      return combineLatest([
        this.loanService.getUserLoans$(user.userId),
        this.paymentService.getUserPayments$(user.userId)
      ]).pipe(
        map(([loans, payments]) => {
          const activeLoans = loans.filter(l => (l.status || '').toLowerCase() === 'active' && l.pendingAmount > 0 && l.paidMonths < l.totalMonths);
          return {
            activeLoans,
            payments
          };
        })
      );
    })
  );

  ngOnInit(): void {}

  hasPendingRequest(loan: Loan, payments: Payment[]): boolean {
    return payments.some(p => p.loanId === loan.loanId && p.status === 'Pending');
  }

  getNextPendingInstallment(loan: Loan): RepaymentInstallment | undefined {
    return (loan.repaymentSchedule || []).find(i => (i.status || '').toLowerCase() === 'pending');
  }

  openPaymentModal(loan: Loan, installment?: RepaymentInstallment): void {
    if (!installment) {
      installment = this.getNextPendingInstallment(loan);
    }
    if (!installment) {
      this.toast.info('All installments have already been paid for this loan.', 'Loan Completed');
      return;
    }

    this.activeModalLoan.set(loan);
    this.activeModalInstallment.set(installment);
    this.paymentForm.reset({
      paymentMethod: 'UPI',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Installment #${installment.installmentNumber || installment.installmentNo}/${loan.totalMonths} for ${loan.loanId}`
    });
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen.set(false);
    this.activeModalLoan.set(null);
    this.activeModalInstallment.set(null);
  }

  private me = toSignal(this.authService.getCurrentUser$());
  get monthlyDeposit(): number { return depositFor(this.me()); }

  async submitPayment(): Promise<void> {
    if (this.paymentForm.invalid || !this.activeModalLoan() || !this.activeModalInstallment()) return;

    const loan = this.activeModalLoan()!;
    const inst = this.activeModalInstallment()!;
    const val = this.paymentForm.value;
    const instNo = inst.installmentNumber || inst.installmentNo;

    const ok = await this.confirm.confirm({
      title: 'Confirm Installment Payment',
      message: `You are paying ₹${(inst.amount + this.monthlyDeposit).toLocaleString('en-IN')} (EMI Month #${instNo} ₹${inst.amount.toLocaleString('en-IN')} + ₹${this.monthlyDeposit.toLocaleString('en-IN')} deposit) via ${val.paymentMethod} for loan ${loan.loanId}.\n\nAdmin will verify and approve this payment. Proceed?`,
      confirmText: 'Yes, Pay EMI',
      cancelText: 'Cancel',
      type: 'success'
    });

    if (!ok) return;

    this.isSubmitting.set(true);

    try {
      const res = await this.paymentService.requestPayment({
        loanId: loan.loanId,
        paymentMethod: val.paymentMethod,
        paymentDate: val.paymentDate,
        notes: val.notes
      });

      this.isSubmitting.set(false);
      this.closePaymentModal();

      if (res.success) {
        this.toast.success(res.message, 'Sent for Approval');
      } else {
        this.toast.error(res.message, 'Payment Failed');
      }
    } catch (err: any) {
      this.isSubmitting.set(false);
      this.toast.error(err.message || 'Payment processing failed', 'Error');
    }
  }
}
