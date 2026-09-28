import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { PaymentService } from '../../../core/services/payment.service';
import { UserService } from '../../../core/services/user.service';
import { Loan } from '../../../core/models/loan.model';
import { Payment } from '../../../core/models/payment.model';
import { User } from '../../../core/models/user.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { RepaymentScheduleComponent } from '../../../shared/components/repayment-schedule/repayment-schedule.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, InrCurrencyPipe, RepaymentScheduleComponent, EmptyStateComponent],
  template: `
    <div class="page-container" *ngIf="loan()">
      <!-- Back button & Header -->
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/admin/loans" class="btn-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span>Back to All Loans</span>
          </a>
          <h1 class="page-title">{{ loan()?.loanId }}</h1>
          <span class="badge" [ngClass]="loan()?.status === 'Completed' ? 'badge-success' : 'badge-warning'">
            {{ loan()?.status }}
          </span>
        </div>
      </div>

      <!-- Loan Summary Hero -->
      <div class="hero-card">
        <div class="hero-main">
          <span class="hero-lbl">Total Loan Disbursed</span>
          <div class="hero-val">{{ (loan()?.loanAmount || 0) | inrCurrency }}</div>
          <div class="hero-purpose">
            <b>Purpose:</b> {{ loan()?.loanPurpose }}
          </div>
        </div>

        <div class="hero-grid">
          <div class="hero-stat">
            <span class="lbl">Monthly EMI</span>
            <span class="val font-bold">{{ (loan()?.monthlyEMI || 0) | inrCurrency }}/mo</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">Fixed Term</span>
            <span class="val">12 Months</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">Disbursed On</span>
            <span class="val">{{ loan()?.loanDate }}</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">EMIs Paid</span>
            <span class="val text-success">{{ loan()?.paidMonths }}/12 Paid</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">Total Paid</span>
            <span class="val text-success">{{ (loan()?.paidAmount || 0) | inrCurrency }}</span>
          </div>
          <div class="hero-stat">
            <span class="lbl">Outstanding</span>
            <span class="val text-danger">{{ (loan()?.pendingAmount || 0) | inrCurrency }}</span>
          </div>
        </div>
      </div>

      <!-- Borrower Info Card -->
      <div class="borrower-card">
        <div class="borrower-header">
          <div class="b-avatar">{{ loan()?.userName?.charAt(0) }}</div>
          <div class="b-info">
            <h3 class="b-name">{{ loan()?.userName }}</h3>
            <span class="user-id-badge">{{ loan()?.userId }}</span>
          </div>
        </div>
        <div class="borrower-details" *ngIf="borrower()">
          <div class="b-detail-item">
            <span class="b-lbl">Mobile:</span>
            <span class="b-val">{{ borrower()?.mobile }}</span>
          </div>
          <div class="b-detail-item">
            <span class="b-lbl">Email:</span>
            <span class="b-val">{{ borrower()?.email }}</span>
          </div>
          <div class="b-detail-item">
            <span class="b-lbl">Occupation:</span>
            <span class="b-val">{{ borrower()?.occupation || 'Member' }}</span>
          </div>
          <div class="b-detail-item">
            <span class="b-lbl">Available Balance:</span>
            <span class="b-val text-success font-bold">{{ (borrower()?.totalAmount || 0) | inrCurrency }}</span>
          </div>
        </div>
        <div class="borrower-action">
          <a [routerLink]="['/admin/users', loan()?.userId]" class="btn btn-secondary">
            View Borrower Profile →
          </a>
        </div>
      </div>

      <!-- 12-Month Schedule Section -->
      <div class="schedule-section">
        <h2 class="section-title">12-Month Repayment Schedule</h2>
        <div class="content-card">
          <app-repayment-schedule
            [loan]="loan()!"
            [showPayAction]="false"
          ></app-repayment-schedule>
        </div>
      </div>

      <!-- Payment Receipts / History Log -->
      <div class="payments-section">
        <h2 class="section-title">Payment Transaction Log</h2>
        <div class="content-card">
          <div class="table-responsive" *ngIf="loanPayments().length > 0">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Installment</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of loanPayments()">
                  <td><span class="code-badge">{{ p.paymentId }}</span></td>
                  <td>Month {{ p.installmentNumber }} of 12</td>
                  <td>{{ p.paymentDate }}</td>
                  <td class="font-bold text-success">{{ p.amount | inrCurrency }}</td>
                  <td><span class="cat-pill">{{ p.paymentMethod }}</span></td>
                  <td><span class="ref-text">{{ p.transactionRef }}</span></td>
                  <td><span class="badge badge-success">Success</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <app-empty-state
            *ngIf="loanPayments().length === 0"
            title="No payments made yet"
            description="Payment entries will appear here once the member pays their monthly EMIs."
          ></app-empty-state>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      color: #475569;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #172033;
      margin: 0;
      font-family: monospace;
    }
    .badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 700;
    }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-warning { background: #FEF3C7; color: #B45309; }

    .hero-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .hero-lbl {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.04em;
    }
    .hero-val {
      font-size: 2.2rem;
      font-weight: 800;
      color: #3155C8;
      letter-spacing: -0.02em;
    }
    .hero-purpose {
      font-size: 0.95rem;
      color: #334155;
      margin-top: 4px;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #F1F5F9;
    }
    .hero-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .hero-stat .lbl { font-size: 0.72rem; font-weight: 600; color: #64748B; text-transform: uppercase; }
    .hero-stat .val { font-size: 1rem; font-weight: 700; color: #1E293B; }
    .text-success { color: #16A34A !important; }
    .text-danger { color: #DC2626 !important; }
    .font-bold { font-weight: 700; }

    .borrower-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .borrower-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .b-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #3155C8;
      color: #ffffff;
      font-weight: 800;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .b-name { font-size: 1.05rem; font-weight: 700; color: #172033; margin: 0; }
    .user-id-badge {
      font-family: monospace;
      font-size: 0.78rem;
      font-weight: 700;
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .borrower-details {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .b-detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .b-lbl { font-size: 0.72rem; color: #64748B; font-weight: 600; }
    .b-val { font-size: 0.88rem; color: #1E293B; font-weight: 600; }
    .btn {
      display: inline-flex;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      background: #ffffff;
      border: 1px solid #CBD5E1;
      color: #334155;
    }
    .btn:hover { background: #F1F5F9; }

    .section-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #172033;
      margin: 0 0 12px 0;
    }
    .content-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .table-responsive { overflow-x: auto; }
    .simple-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .simple-table th { background: #F8FAFC; padding: 12px; text-align: left; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; }
    .simple-table td { padding: 12px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
    .code-badge { font-family: monospace; font-size: 0.8rem; font-weight: 700; }
    .cat-pill { font-size: 0.74rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    .ref-text { font-family: monospace; font-size: 0.78rem; color: #64748B; }
  `]
})
export class LoanDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private userService = inject(UserService);

  loan = signal<Loan | null>(null);
  borrower = signal<User | null>(null);
  loanPayments = signal<Payment[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const loanId = params.get('id');
      if (loanId) {
        this.loadLoanData(loanId);
      }
    });
  }

  loadLoanData(loanId: string): void {
    const l = this.loanService.getLoanById(loanId);
    if (l) {
      this.loan.set(l);
      this.loanPayments.set(this.paymentService.getLoanPayments(l.loanId));
      const u = this.userService.getUserById(l.userId);
      if (u) this.borrower.set(u);
    }
  }
}
