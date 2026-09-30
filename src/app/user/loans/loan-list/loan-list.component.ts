import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoanService } from '../../../core/services/loan.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { Loan, RepaymentInstallment } from '../../../core/models/loan.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { RepaymentScheduleComponent } from '../../../shared/components/repayment-schedule/repayment-schedule.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Observable, switchMap, of, map } from 'rxjs';

@Component({
  selector: 'app-user-loan-list',
  standalone: true,
  imports: [CommonModule, RouterModule, InrCurrencyPipe, RepaymentScheduleComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">My Society Loans</h1>
          <p class="page-subtitle">View your active and completed loans, 10-month schedules, and EMI payment status</p>
        </div>
        <div class="header-actions">
          <a routerLink="/user/take-loan" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            <span>Apply For New Loan</span>
          </a>
        </div>
      </div>

      <!-- Loan Cards Grid -->
      <div class="loans-list" *ngIf="loans$ | async as loans">
        <div *ngFor="let loan of loans" class="loan-item-card">
          <!-- Top Row -->
          <div class="loan-top">
            <div class="loan-id-box">
              <span class="loan-id-code">{{ loan.loanId }}</span>
              <span class="badge" [ngClass]="loan.status === 'Completed' ? 'badge-success' : (loan.status === 'Rejected' ? 'badge-danger' : (loan.status === 'Pending' ? 'badge-pending' : 'badge-warning'))">
                {{ loan.status }}
              </span>
            </div>
            <span class="loan-date">Taken on: {{ loan.loanDate }}</span>
          </div>

          <!-- Purpose -->
          <div class="loan-purpose-text">
            <b>Purpose:</b> {{ loan.loanPurpose }}
          </div>

          <!-- Key Metrics Grid -->
          <div class="loan-metrics-grid">
            <div class="metric-cell">
              <span class="lbl">Loan Amount</span>
              <span class="val font-bold">{{ loan.loanAmount | inrCurrency }}</span>
            </div>
            <div class="metric-cell">
              <span class="lbl">Monthly EMI</span>
              <span class="val">{{ loan.monthlyEMI | inrCurrency }}/mo</span>
            </div>
            <div class="metric-cell">
              <span class="lbl">Paid ({{ loan.paidMonths }}/{{ loan.totalMonths }} mo)</span>
              <span class="val text-success">{{ loan.paidAmount | inrCurrency }}</span>
            </div>
            <div class="metric-cell">
              <span class="lbl">Pending Amount</span>
              <span class="val text-danger">{{ loan.pendingAmount | inrCurrency }}</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-wrap">
            <div class="progress-bar-bg">
              <div
                class="progress-bar-fill"
                [style.width.%]="(loan.paidMonths / loan.totalMonths) * 100"
                [class.completed]="loan.paidMonths === loan.totalMonths"
              ></div>
            </div>
            <div class="progress-info">
              <span><b>{{ loan.paidMonths }}</b> of {{ loan.totalMonths }} EMIs Paid ({{ ((loan.paidMonths / loan.totalMonths) * 100).toFixed(0) }}%)</span>
              <span><b>{{ loan.remainingMonths }}</b> Months Remaining</span>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="loan-actions-footer">
            <button class="btn btn-secondary" (click)="openScheduleModal(loan)">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <span>View Repayment Schedule</span>
            </button>
            <a
              *ngIf="loan.status === 'Active'"
              routerLink="/user/payments"
              class="btn btn-pay"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Pay Next Installment ({{ loan.monthlyEMI | inrCurrency }})</span>
            </a>
          </div>
        </div>

        <app-empty-state
          *ngIf="loans.length === 0"
          title="You have no active or previous loans"
          description="Apply for your first 10-month society micro-loan in just a few clicks!"
          actionText="Apply For Loan"
          (action)="applyLoan()"
        ></app-empty-state>
      </div>

      <!-- Schedule Modal -->
      <div class="modal-backdrop" *ngIf="selectedLoanForModal()" (click)="selectedLoanForModal.set(null)">
        <div class="modal-dialog-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Repayment Schedule</h3>
              <p class="modal-subtitle">Loan <b>{{ selectedLoanForModal()?.loanId }}</b> — {{ selectedLoanForModal()?.loanPurpose }}</p>
            </div>
            <button class="btn-close" (click)="selectedLoanForModal.set(null)">✕</button>
          </div>
          <div class="modal-body-scroll">
            <app-repayment-schedule
              [loan]="selectedLoanForModal()!"
              [showPayAction]="false"
            ></app-repayment-schedule>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #172033; margin: 0; }
    .page-subtitle { font-size: 0.88rem; color: #64748B; margin: 4px 0 0; }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-primary { background: #3155C8; color: #ffffff; }
    .btn-primary:hover { background: #2643A3; transform: translateY(-1px); }
    .btn-secondary { background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; }
    .btn-secondary:hover { background: #E2E8F0; }
    .btn-pay { background: #16A34A; color: #ffffff; }
    .btn-pay:hover { background: #15803D; }

    .loans-list { display: flex; flex-direction: column; gap: 20px; }
    .loan-item-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .loan-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .loan-id-box { display: flex; align-items: center; gap: 10px; }
    .loan-id-code { font-family: monospace; font-weight: 800; font-size: 1.2rem; color: #3155C8; }
    .loan-date { font-size: 0.82rem; color: #64748B; }

    .loan-purpose-text { font-size: 0.92rem; color: #334155; }

    .loan-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
    }
    .metric-cell { display: flex; flex-direction: column; gap: 2px; }
    .metric-cell .lbl { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: #64748B; }
    .metric-cell .val { font-size: 1.05rem; font-weight: 700; color: #172033; }
    .font-bold { font-weight: 800; }
    .text-success { color: #16A34A !important; }
    .text-danger { color: #DC2626 !important; }

    .progress-wrap { display: flex; flex-direction: column; gap: 6px; }
    .progress-bar-bg { height: 10px; background: #E2E8F0; border-radius: 999px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: #3155C8; border-radius: 999px; transition: width 0.4s ease; }
    .progress-bar-fill.completed { background: #16A34A; }
    .progress-info { display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748B; }

    .loan-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid #F1F5F9;
      flex-wrap: wrap;
    }

    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-warning { background: #FEF3C7; color: #B45309; }
    .badge-danger { background: #FEE2E2; color: #DC2626; }
    .badge-pending { background: #E0E7FF; color: #4338CA; }


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
    .modal-dialog-large {
      background: #ffffff;
      border-radius: 18px;
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
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
    .modal-title { font-size: 1.2rem; font-weight: 800; color: #172033; margin: 0; }
    .modal-subtitle { font-size: 0.84rem; color: #64748B; margin: 4px 0 0; }
    .btn-close { background: none; border: none; font-size: 1.2rem; color: #94A3B8; cursor: pointer; }
    .modal-body-scroll { padding: 24px; overflow-y: auto; }
  `]
})
export class UserLoanListComponent {
  private authService = inject(AuthService);
  private loanService = inject(LoanService);

  loans$: Observable<Loan[]> = this.authService.getCurrentUser$().pipe(
    switchMap(user => {
      if (!user) return of([]);
      return this.loanService.getAllLoans$().pipe(
        map(loans => loans.filter(l => l.userUid === user.uid || l.userId === user.userId))
      );
    })
  );

  selectedLoanForModal = signal<Loan | null>(null);

  openScheduleModal(loan: Loan): void {
    this.selectedLoanForModal.set(loan);
  }

  applyLoan(): void {}
}
