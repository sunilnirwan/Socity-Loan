import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Loan } from '../../../core/models/loan.model';
import { Payment } from '../../../core/models/payment.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { RepaymentScheduleComponent } from '../../../shared/components/repayment-schedule/repayment-schedule.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-user-loan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, InrCurrencyPipe, RepaymentScheduleComponent, EmptyStateComponent],
  template: `
    <div class="page-container" *ngIf="loan()">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/user/loans" class="btn-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span>Back to My Loans</span>
          </a>
          <h1 class="page-title">{{ loan()?.loanId }}</h1>
          <span class="badge" [ngClass]="loan()?.status === 'Completed' ? 'badge-success' : 'badge-warning'">
            {{ loan()?.status }}
          </span>
        </div>
        <div class="header-actions" *ngIf="loan()?.status === 'Active'">
          <a routerLink="/user/payments" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Pay Installment ({{ loan()?.monthlyEMI | inrCurrency }})</span>
          </a>
        </div>
      </div>

      <!-- Hero Card -->
      <div class="hero-card">
        <div class="hero-main">
          <span class="hero-lbl">Loan Amount Disbursed</span>
          <div class="hero-val">{{ (loan()?.loanAmount || 0) | inrCurrency }}</div>
          <div class="hero-purpose"><b>Purpose:</b> {{ loan()?.loanPurpose }}</div>
        </div>

        <div class="hero-grid">
          <div class="hero-stat">
            <span class="lbl">Monthly EMI (12 Mo)</span>
            <span class="val font-bold">{{ (loan()?.monthlyEMI || 0) | inrCurrency }}/mo</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">Repayment Term</span>
            <span class="val">12 Months (Fixed)</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">EMIs Paid</span>
            <span class="val text-success">{{ loan()?.paidMonths }}/12 Paid</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">Paid Amount</span>
            <span class="val text-success">{{ (loan()?.paidAmount || 0) | inrCurrency }}</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">Pending Balance</span>
            <span class="val text-danger">{{ (loan()?.pendingAmount || 0) | inrCurrency }}</span>
          </div>
        </div>
      </div>

      <!-- 12-Month Schedule Section -->
      <div class="schedule-section">
        <h2 class="section-title">Complete 12-Month Repayment Schedule</h2>
        <div class="content-card">
          <app-repayment-schedule
            [loan]="loan()!"
            [showPayAction]="false"
          ></app-repayment-schedule>
        </div>
      </div>

      <!-- Payment Receipts -->
      <div class="payments-section">
        <h2 class="section-title">Payment Receipts</h2>
        <div class="content-card">
          <div class="table-responsive" *ngIf="payments().length > 0">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Installment</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of payments()">
                  <td><span class="code-badge">{{ p.paymentId }}</span></td>
                  <td>Month {{ p.installmentNumber }}/12</td>
                  <td>{{ p.paymentDate }}</td>
                  <td class="font-bold text-success">{{ p.amount | inrCurrency }}</td>
                  <td><span class="cat-pill">{{ p.paymentMethod }}</span></td>
                  <td><span class="ref-text">{{ p.transactionRef }}</span></td>
                  <td><span class="badge badge-success">Paid</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <app-empty-state
            *ngIf="payments().length === 0"
            title="No payments made yet"
            description="Payments made towards this loan will appear here."
          ></app-empty-state>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .btn-back { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #ffffff; border: 1px solid #CBD5E1; border-radius: 8px; color: #475569; font-size: 0.82rem; font-weight: 600; text-decoration: none; }
    .page-title { font-size: 1.45rem; font-weight: 800; color: #172033; margin: 0; font-family: monospace; }
    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-warning { background: #FEF3C7; color: #B45309; }
    .btn-primary { background: #3155C8; color: #ffffff; padding: 10px 18px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }

    .hero-card {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #E2E8F0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
    }
    .hero-lbl { font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: #64748B; }
    .hero-val { font-size: 2.2rem; font-weight: 800; color: #3155C8; }
    .hero-purpose { font-size: 0.92rem; color: #334155; }

    .hero-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid #F1F5F9;
    }
    .hero-stat { display: flex; flex-direction: column; gap: 2px; }
    .hero-stat .lbl { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: #64748B; }
    .hero-stat .val { font-size: 1rem; font-weight: 700; color: #1E293B; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16A34A !important; }
    .text-danger { color: #DC2626 !important; }

    .section-title { font-size: 1.2rem; font-weight: 800; color: #172033; margin: 0 0 12px 0; }
    .content-card { background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }

    .table-responsive { overflow-x: auto; }
    .simple-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .simple-table th { background: #F8FAFC; padding: 12px; text-align: left; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; }
    .simple-table td { padding: 12px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
    .code-badge { font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #334155; }
    .cat-pill { font-size: 0.74rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    .ref-text { font-family: monospace; font-size: 0.76rem; color: #64748B; }
  `]
})
export class UserLoanDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);

  loan = signal<Loan | null>(null);
  payments = signal<Payment[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        const l = this.loanService.getLoanById(id);
        if (l) {
          this.loan.set(l);
          this.payments.set(this.paymentService.getLoanPayments(l.loanId));
        }
      }
    });
  }
}
