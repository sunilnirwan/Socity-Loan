import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { LoanService } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { TransactionService } from '../../core/services/transaction.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, InrCurrencyPipe],
  template: `
    <div class="page-container" *ngIf="userDashboard$ | async as data">
      <!-- Member Welcome Banner -->
      <div class="welcome-card">
        <div class="welcome-left">
          <div class="user-avatar-lg">{{ data.user.name.charAt(0) }}</div>
          <div class="user-welcome-meta">
            <div class="welcome-title-row">
              <h1 class="welcome-name">Welcome, {{ data.user.name }}</h1>
              <span class="user-id-badge">{{ data.user.userId }}</span>
            </div>
            <p class="welcome-desc">Member since {{ data.user.createdAt }} • {{ data.user.mobile }} • {{ data.user.email }}</p>
          </div>
        </div>
        <div class="welcome-actions">
          <a routerLink="/user/take-loan" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            <span>Apply For Loan</span>
          </a>
          <a routerLink="/user/payments" class="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Pay Installment</span>
          </a>
        </div>
      </div>

      <!-- 5 Summary Cards -->
      <div class="stats-grid">
        <!-- 1. Available Amount -->
        <app-stat-card
          title="Available Amount"
          [value]="data.user.totalAmount || 0"
          [isCurrency]="true"
          colorScheme="success"
          subtitle="Your Society Balance / Savings"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        </app-stat-card>

        <!-- 2. Total Loan -->
        <app-stat-card
          title="Total Loan"
          [value]="data.totalLoanAmount"
          [isCurrency]="true"
          colorScheme="purple"
          subtitle="Total principal taken"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
        </app-stat-card>

        <!-- 3. Paid Amount -->
        <app-stat-card
          title="Paid Amount"
          [value]="data.totalPaidAmount"
          [isCurrency]="true"
          colorScheme="cyan"
          subtitle="Repaid installments"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </app-stat-card>

        <!-- 4. Pending Loan -->
        <app-stat-card
          title="Pending Loan"
          [value]="data.totalPendingAmount"
          [isCurrency]="true"
          colorScheme="danger"
          subtitle="Remaining to be paid"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </app-stat-card>

        <!-- 5. Loan Status -->
        <div class="stat-card status-card">
          <div class="stat-header">
            <span class="stat-title">Loan Status</span>
            <div class="stat-icon-wrapper" [ngClass]="getStatusIconClass(data.overallLoanStatus)">
              <svg *ngIf="data.overallLoanStatus === 'Active'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <svg *ngIf="data.overallLoanStatus === 'Completed'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <svg *ngIf="data.overallLoanStatus === 'No Loan'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value" [ngClass]="getStatusTextClass(data.overallLoanStatus)">
              {{ data.overallLoanStatus }}
            </div>
            <div class="stat-subtitle">
              <span *ngIf="data.activeLoan">Next EMI: {{ data.activeLoan.monthlyEMI | inrCurrency }}</span>
              <span *ngIf="!data.activeLoan">Eligible for 12-mo micro-loan</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Loan Progress Card -->
      <div class="active-loan-banner" *ngIf="data.activeLoan">
        <div class="active-loan-top">
          <div>
            <div class="active-loan-badge">CURRENT ACTIVE LOAN ({{ data.activeLoan.totalMonths }} MONTHS FIXED)</div>
            <h3 class="active-loan-title">
              {{ data.activeLoan.loanId }} — {{ data.activeLoan.loanPurpose }}
            </h3>
          </div>
          <a routerLink="/user/payments" class="btn btn-pay-active">
            Pay Next EMI ({{ data.activeLoan.monthlyEMI | inrCurrency }}) →
          </a>
        </div>

        <div class="active-loan-progress-wrap">
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              [style.width.%]="(data.activeLoan.paidMonths / data.activeLoan.totalMonths) * 100"
            ></div>
          </div>
          <div class="progress-meta">
            <span><b>{{ data.activeLoan.paidMonths }}</b> of {{ data.activeLoan.totalMonths }} Months Paid</span>
            <span><b>{{ data.activeLoan.remainingMonths }}</b> Months Remaining ({{ data.activeLoan.pendingAmount | inrCurrency }})</span>
          </div>
        </div>
      </div>

      <!-- 2-Column Section: Recent Payments & Recent Transactions -->
      <div class="dashboard-grid-2">
        <!-- Recent Payments -->
        <div class="content-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Recent EMI Payments</h3>
              <p class="card-desc">Your latest installment receipts</p>
            </div>
            <a routerLink="/user/payments" class="card-link">All Payments →</a>
          </div>

          <div class="table-responsive" *ngIf="data.recentPayments.length > 0">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Installment</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of data.recentPayments">
                  <td><span class="code-link">{{ p.paymentId }}</span></td>
                  <td>Month {{ p.installmentNumber }}</td>
                  <td>{{ p.paymentDate }}</td>
                  <td class="font-bold text-success">{{ p.amount | inrCurrency }}</td>
                  <td><span class="badge badge-success">Success</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="empty-box" *ngIf="data.recentPayments.length === 0">
            No EMI payments made yet.
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="content-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">My Account Transactions</h3>
              <p class="card-desc">Recent credits, loans, and deductions</p>
            </div>
            <a routerLink="/user/transactions" class="card-link">All Ledger →</a>
          </div>

          <div class="txn-list" *ngIf="data.recentTxns.length > 0">
            <div *ngFor="let txn of data.recentTxns" class="txn-item">
              <div class="txn-icon" [ngClass]="txn.type === 'credit' ? 'icon-credit' : 'icon-debit'">
                <svg *ngIf="txn.type === 'credit'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                <svg *ngIf="txn.type === 'debit'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
              </div>
              <div class="txn-meta">
                <div class="txn-desc">{{ txn.description }}</div>
                <div class="txn-sub">{{ txn.date }} • {{ txn.category }}</div>
              </div>
              <div class="txn-amount" [ngClass]="txn.type === 'credit' ? 'text-credit' : 'text-debit'">
                {{ txn.type === 'credit' ? '+' : '-' }}{{ txn.amount | inrCurrency }}
              </div>
            </div>
          </div>
          <div class="empty-box" *ngIf="data.recentTxns.length === 0">
            No transactions found.
          </div>
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

    .welcome-card {
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      border-radius: 20px;
      padding: 28px 32px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }
    .welcome-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .user-avatar-lg {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: #3155C8;
      color: #ffffff;
      font-size: 1.6rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(49, 85, 200, 0.4);
      flex-shrink: 0;
    }
    .welcome-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .welcome-name {
      font-size: 1.45rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.01em;
      color:#fff;
    }
    .user-id-badge {
      font-family: monospace;
      font-size: 0.84rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.15);
      color: #93C5FD;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .welcome-desc {
      font-size: 0.84rem;
      color: #94A3B8;
      margin: 6px 0 0;
    }
    .welcome-actions {
      display: flex;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-primary { background: #3155C8; color: #ffffff; }
    .btn-primary:hover { background: #2643A3; transform: translateY(-1px); }
    .btn-secondary { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.2); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
    }

    .status-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 22px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .stat-title { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: #64748B; letter-spacing: 0.06em; }
    .stat-icon-wrapper { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .icon-active { background: #FEF3C7; color: #D97706; }
    .icon-completed { background: #DCFCE7; color: #16A34A; }
    .icon-none { background: #F1F5F9; color: #64748B; }

    .stat-value { font-size: 1.6rem; font-weight: 800; color: #172033; line-height: 1.2; }
    .stat-subtitle { font-size: 0.82rem; color: #64748B; margin-top: 8px; }
    .text-active { color: #D97706; }
    .text-completed { color: #16A34A; }
    .text-none { color: #64748B; }

    .active-loan-banner {
      background: #ffffff;
      border: 1.5px solid #BFDBFE;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(49, 85, 200, 0.08);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .active-loan-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .active-loan-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: #3155C8;
      letter-spacing: 0.08em;
    }
    .active-loan-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #172033;
      margin: 4px 0 0;
    }
    .btn-pay-active {
      background: #16A34A;
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      transition: all 0.15s;
    }
    .btn-pay-active:hover { background: #15803D; transform: translateY(-1px); }

    .active-loan-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .progress-bar-bg {
      height: 12px;
      background: #EFF6FF;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid #DBEAFE;
    }
    .progress-bar-fill {
      height: 100%;
      background: #3155C8;
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .progress-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.84rem;
      color: #475569;
    }

    .dashboard-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .content-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .card-title { font-size: 1.1rem; font-weight: 700; color: #172033; margin: 0; }
    .card-desc { font-size: 0.82rem; color: #64748B; margin: 3px 0 0; }
    .card-link { color: #3155C8; font-size: 0.85rem; font-weight: 700; text-decoration: none; }
    .card-link:hover { text-decoration: underline; }

    .table-responsive { overflow-x: auto; }
    .simple-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
    .simple-table th { background: #F8FAFC; padding: 10px 12px; text-align: left; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; }
    .simple-table td { padding: 12px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
    .code-link { font-family: monospace; font-weight: 700; color: #3155C8; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16A34A !important; }
    .badge { padding: 4px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .badge-success { background: #DCFCE7; color: #15803D; }

    .txn-list { display: flex; flex-direction: column; gap: 10px; }
    .txn-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #F8FAFC;
      border: 1px solid #F1F5F9;
    }
    .txn-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-credit { background: #DCFCE7; color: #16A34A; }
    .icon-debit { background: #FEE2E2; color: #DC2626; }
    .txn-meta { flex: 1; overflow: hidden; }
    .txn-desc { font-size: 0.84rem; font-weight: 600; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .txn-sub { font-size: 0.72rem; color: #64748B; margin-top: 2px; }
    .txn-amount { font-size: 0.92rem; font-weight: 800; }
    .text-credit { color: #16A34A; }
    .text-debit { color: #DC2626; }

    .empty-box {
      padding: 32px;
      text-align: center;
      color: #94A3B8;
      font-size: 0.88rem;
    }

    @media (max-width: 1024px) {
      .dashboard-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class UserDashboardComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private txnService = inject(TransactionService);

  userDashboard$ = combineLatest([
    this.authService.getCurrentUser$(),
    this.userService.getUsers$(),
    this.loanService.getLoans$(),
    this.paymentService.getPayments$(),
    this.txnService.getTransactions$()
  ]).pipe(
    map(([sessionUser, users, allLoans, allPayments, allTxns]) => {
      if (!sessionUser) return null;

      const liveUser = users.find(u =>
        (sessionUser.uid && u.uid === sessionUser.uid) ||
        u.userId.toUpperCase() === sessionUser.userId.toUpperCase()
      ) || sessionUser;

      const userLoans = allLoans.filter(l =>
        l.userId.toUpperCase() === sessionUser.userId.toUpperCase() ||
        (sessionUser.uid && l.userUid === sessionUser.uid)
      );

      const userPayments = allPayments.filter(p =>
        p.userId.toUpperCase() === sessionUser.userId.toUpperCase() ||
        (sessionUser.uid && p.userUid === sessionUser.uid)
      );

      const userTxns = allTxns.filter(t =>
        t.userId.toUpperCase() === sessionUser.userId.toUpperCase() ||
        (sessionUser.uid && t.userUid === sessionUser.uid)
      );

      const totalLoanAmount = userLoans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
      const totalPaidAmount = userLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
      const totalPendingAmount = userLoans.reduce((sum, l) => sum + (l.pendingAmount || 0), 0);

      const activeLoan = userLoans.find(l => l.status === 'Active');
      let overallLoanStatus = 'No Loan';
      if (activeLoan) {
        overallLoanStatus = 'Active';
      } else if (userLoans.some(l => l.status === 'Completed')) {
        overallLoanStatus = 'Completed';
      }

      return {
        user: liveUser,
        totalLoanAmount,
        totalPaidAmount,
        totalPendingAmount,
        activeLoan,
        overallLoanStatus,
        recentPayments: userPayments.slice(0, 4),
        recentTxns: userTxns.slice(0, 4)
      };
    })
  );

  getStatusIconClass(status: string): string {
    switch (status) {
      case 'Active': return 'icon-active';
      case 'Completed': return 'icon-completed';
      default: return 'icon-none';
    }
  }

  getStatusTextClass(status: string): string {
    switch (status) {
      case 'Active': return 'text-active';
      case 'Completed': return 'text-completed';
      default: return 'text-none';
    }
  }
}
