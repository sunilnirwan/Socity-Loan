import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { UserService } from '../../core/services/user.service';
import { LoanService } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { TransactionService } from '../../core/services/transaction.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, InrCurrencyPipe],
  template: `
    <div class="page-container" *ngIf="stats$ | async as stats">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Admin Overview & Analytics</h1>
          <p class="page-subtitle">Real-time financial status, members, and loan distributions</p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/users" class="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Manage Users</span>
          </a>
          <a routerLink="/admin/loans" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M7 15h.01"/><path d="M17 15h.01"/></svg>
            <span>View All Loans</span>
          </a>
        </div>
      </div>

      <!-- 6 KPI Stat Cards -->
      <div class="stats-grid">
        <!-- 1. Total Users -->
        <app-stat-card
          title="Total Users"
          [value]="stats.totalUsers"
          [isCurrency]="false"
          colorScheme="primary"
          subtitle="Registered society members"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </app-stat-card>

        <!-- 2. Total Amount -->
        <app-stat-card
          title="Total Amount"
          [value]="stats.totalAmount"
          [isCurrency]="true"
          colorScheme="success"
          subtitle="Member savings & deposits"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </app-stat-card>

        <!-- 3. Total Loans -->
        <app-stat-card
          title="Total Loans"
          [value]="stats.totalLoanAmount"
          [isCurrency]="true"
          colorScheme="purple"
          subtitle="Cumulative principal disbursed"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        </app-stat-card>

        <!-- 4. Active Loans -->
        <app-stat-card
          title="Active Loans"
          [value]="stats.activeLoansCount"
          [isCurrency]="false"
          colorScheme="warning"
          subtitle="Ongoing 12-month repayments"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </app-stat-card>

        <!-- 5. Paid Amount -->
        <app-stat-card
          title="Paid Amount"
          [value]="stats.totalPaidAmount"
          [isCurrency]="true"
          colorScheme="cyan"
          subtitle="EMIs collected to date"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </app-stat-card>

        <!-- 6. Pending Amount -->
        <app-stat-card
          title="Pending Amount"
          [value]="stats.totalPendingAmount"
          [isCurrency]="true"
          colorScheme="danger"
          subtitle="Outstanding loan recovery"
        >
          <svg icon xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </app-stat-card>
      </div>

      <!-- Financial Health & Recovery Progress Bar -->
      <div class="recovery-card">
        <div class="recovery-header">
          <div class="recovery-info">
            <h3 class="card-title">Society Loan Recovery Progress</h3>
            <p class="card-desc">Collection status across all active & completed micro-loans</p>
          </div>
          <div class="recovery-badge">
            <b>{{ stats.recoveryPercentage }}%</b> Collected
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" [style.width.%]="stats.recoveryPercentage"></div>
        </div>
        <div class="recovery-footer">
          <div class="footer-stat">
            <span class="dot dot-success"></span>
            <span>Total Collected: <b>{{ stats.totalPaidAmount | inrCurrency }}</b></span>
          </div>
          <div class="footer-stat">
            <span class="dot dot-danger"></span>
            <span>Outstanding EMI Balance: <b>{{ stats.totalPendingAmount | inrCurrency }}</b></span>
          </div>
        </div>
      </div>

      <!-- Recent Loans and Transactions 2-Column Section -->
      <div class="dashboard-grid-2">
        <!-- Recent Loans -->
        <div class="content-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Recent Loans</h3>
              <p class="card-desc">Latest member loan disbursements</p>
            </div>
            <a routerLink="/admin/loans" class="card-link">View All →</a>
          </div>

          <div class="table-responsive">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let loan of stats.recentLoans">
                  <td>
                    <a [routerLink]="['/admin/loans', loan.loanId]" class="code-link">{{ loan.loanId }}</a>
                  </td>
                  <td>
                    <div class="member-cell">
                      <span class="m-name">{{ loan.userName }}</span>
                      <span class="m-id">{{ loan.userId }}</span>
                    </div>
                  </td>
                  <td class="font-bold">{{ loan.loanAmount | inrCurrency }}</td>
                  <td>
                    <span class="badge" [ngClass]="loan.status === 'Completed' ? 'badge-success' : 'badge-warning'">
                      {{ loan.status }}
                    </span>
                  </td>
                  <td>
                    <span class="progress-text">{{ loan.paidMonths }}/12 mo</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="content-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Recent Ledger Entries</h3>
              <p class="card-desc">Credits, contributions, and EMI payments</p>
            </div>
            <a routerLink="/admin/transactions" class="card-link">All Ledger →</a>
          </div>

          <div class="txn-list">
            <div *ngFor="let txn of stats.recentTxns" class="txn-item">
              <div class="txn-icon" [ngClass]="txn.type === 'credit' ? 'icon-credit' : 'icon-debit'">
                <svg *ngIf="txn.type === 'credit'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                <svg *ngIf="txn.type === 'debit'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
              </div>
              <div class="txn-meta">
                <div class="txn-desc">{{ txn.description }}</div>
                <div class="txn-sub">{{ txn.userName }} ({{ txn.userId }}) • {{ txn.date }}</div>
              </div>
              <div class="txn-amount" [ngClass]="txn.type === 'credit' ? 'text-credit' : 'text-debit'">
                {{ txn.type === 'credit' ? '+' : '-' }}{{ txn.amount | inrCurrency }}
              </div>
            </div>
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
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #172033;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 0.88rem;
      color: #64748B;
      margin: 4px 0 0;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      font-size: 0.88rem;
      font-weight: 600;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: #3155C8;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(49, 85, 200, 0.25);
    }
    .btn-primary:hover {
      background: #2643A3;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border: 1px solid #E2E8F0;
    }
    .btn-secondary:hover {
      background: #F8FAFC;
      border-color: #CBD5E1;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .recovery-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .recovery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #172033;
      margin: 0;
    }
    .card-desc {
      font-size: 0.82rem;
      color: #64748B;
      margin: 3px 0 0;
    }
    .recovery-badge {
      background: #DCFCE7;
      color: #15803D;
      font-size: 0.9rem;
      padding: 6px 14px;
      border-radius: 999px;
    }
    .progress-bar-container {
      height: 12px;
      background: #F1F5F9;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3155C8, #16A34A);
      border-radius: 999px;
      transition: width 0.5s ease;
    }
    .recovery-footer {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    .footer-stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #475569;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-success { background: #16A34A; }
    .dot-danger { background: #DC2626; }

    .dashboard-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .content-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
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
    .card-link {
      color: #3155C8;
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
    }
    .card-link:hover {
      text-decoration: underline;
    }

    .table-responsive {
      overflow-x: auto;
    }
    .simple-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.86rem;
    }
    .simple-table th {
      text-align: left;
      padding: 10px 12px;
      background: #F8FAFC;
      color: #64748B;
      font-weight: 600;
      border-bottom: 1px solid #E2E8F0;
    }
    .simple-table td {
      padding: 12px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
      vertical-align: middle;
    }
    .code-link {
      color: #3155C8;
      font-weight: 700;
      font-family: monospace;
      text-decoration: none;
    }
    .member-cell {
      display: flex;
      flex-direction: column;
    }
    .m-name { font-weight: 600; }
    .m-id { font-size: 0.75rem; color: #64748B; font-family: monospace; }
    .font-bold { font-weight: 700; }
    .progress-text { font-size: 0.8rem; color: #475569; font-weight: 600; }

    .badge {
      display: inline-flex;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-warning { background: #FEF3C7; color: #B45309; }

    .txn-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
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
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-credit { background: #DCFCE7; color: #16A34A; }
    .icon-debit { background: #FEE2E2; color: #DC2626; }
    .txn-meta {
      flex: 1;
      overflow: hidden;
    }
    .txn-desc {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1E293B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .txn-sub {
      font-size: 0.74rem;
      color: #64748B;
      margin-top: 2px;
    }
    .txn-amount {
      font-size: 0.95rem;
      font-weight: 800;
      font-family: inherit;
    }
    .text-credit { color: #16A34A; }
    .text-debit { color: #DC2626; }

    @media (max-width: 1024px) {
      .dashboard-grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent {
  private storage = inject(LocalStorageService);
  private userService = inject(UserService);
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private txnService = inject(TransactionService);

  stats$ = combineLatest([
    this.storage.getUsers$(),
    this.storage.getLoans$(),
    this.storage.getPayments$(),
    this.storage.getTransactions$()
  ]).pipe(
    map(([users, loans, payments, txns]) => {
      const totalUsers = users.length;
      const totalAmount = users.reduce((sum, u) => sum + (u.totalAmount || 0), 0);
      const totalLoanAmount = loans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
      const activeLoansCount = loans.filter(l => l.status === 'Active').length;
      const totalPaidAmount = loans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
      const totalPendingAmount = loans.reduce((sum, l) => sum + (l.pendingAmount || 0), 0);

      const recoveryPercentage = totalLoanAmount > 0
        ? Math.round((totalPaidAmount / totalLoanAmount) * 100)
        : 0;

      return {
        totalUsers,
        totalAmount,
        totalLoanAmount,
        activeLoansCount,
        totalPaidAmount,
        totalPendingAmount,
        recoveryPercentage,
        recentLoans: loans.slice(0, 5),
        recentTxns: txns.slice(0, 5)
      };
    })
  );
}
