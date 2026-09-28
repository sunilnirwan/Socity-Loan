import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { LoanService } from '../../../core/services/loan.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/user.model';
import { Loan } from '../../../core/models/loan.model';
import { Transaction } from '../../../core/models/transaction.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { RepaymentScheduleComponent } from '../../../shared/components/repayment-schedule/repayment-schedule.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, InrCurrencyPipe, RepaymentScheduleComponent, EmptyStateComponent],
  template: `
    <div class="page-container" *ngIf="user()">
      <!-- Back button & Header -->
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/admin/users" class="btn-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span>Back to Members</span>
          </a>
          <h1 class="page-title">{{ user()?.name }}</h1>
          <span class="user-id-badge">{{ user()?.userId }}</span>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="isAddAmountOpen.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Amount / Credit</span>
          </button>
        </div>
      </div>

      <!-- Member Profile Overview Card -->
      <div class="profile-card">
        <div class="profile-avatar">{{ user()?.name?.charAt(0) }}</div>
        <div class="profile-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Mobile Number</span>
            <span class="meta-val">{{ user()?.mobile }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Email Address</span>
            <span class="meta-val">{{ user()?.email }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Occupation</span>
            <span class="meta-val">{{ user()?.occupation || 'Member' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Address</span>
            <span class="meta-val">{{ user()?.address || 'Jaipur' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Joined Date</span>
            <span class="meta-val">{{ user()?.createdAt }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Account Status</span>
            <span class="badge badge-success">Active Member</span>
          </div>
        </div>
      </div>

      <!-- Financial Metrics Grid -->
      <div class="stats-grid">
        <div class="stat-box primary">
          <span class="stat-lbl">Account Balance / Savings</span>
          <span class="stat-val text-success">{{ (user()?.totalAmount || 0) | inrCurrency }}</span>
          <span class="stat-sub">Available Society Balance</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">Total Loans Taken</span>
          <span class="stat-val">{{ totalLoansAmount() | inrCurrency }}</span>
          <span class="stat-sub">{{ userLoans().length }} Total Loans</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">Total EMIs Paid</span>
          <span class="stat-val text-success">{{ totalPaidAmount() | inrCurrency }}</span>
          <span class="stat-sub">Paid on time</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">Remaining Loan Balance</span>
          <span class="stat-val text-danger">{{ totalPendingAmount() | inrCurrency }}</span>
          <span class="stat-sub">{{ activeLoansCount() }} Active Loans</span>
        </div>
      </div>

      <!-- Tabs for Loans vs Transactions -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'LOANS'"
          (click)="activeTab.set('LOANS')"
        >
          Member Loans ({{ userLoans().length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'TXNS'"
          (click)="activeTab.set('TXNS')"
        >
          Transaction History ({{ userTxns().length }})
        </button>
      </div>

      <!-- Tab 1: Member Loans -->
      <div class="tab-content" *ngIf="activeTab() === 'LOANS'">
        <div *ngIf="userLoans().length === 0">
          <app-empty-state
            title="No loans found for this member"
            description="This member has not applied for or taken any society loans yet."
          ></app-empty-state>
        </div>

        <div class="loans-accordion" *ngFor="let loan of userLoans()">
          <div class="loan-card">
            <div class="loan-card-header">
              <div class="loan-id-wrap">
                <span class="loan-id">{{ loan.loanId }}</span>
                <span class="loan-purpose">{{ loan.loanPurpose }}</span>
              </div>
              <div class="loan-badges">
                <span class="badge" [ngClass]="loan.status === 'Completed' ? 'badge-success' : 'badge-warning'">
                  {{ loan.status }}
                </span>
              </div>
            </div>

            <!-- 12-Month Schedule Component Embedded -->
            <app-repayment-schedule [loan]="loan" [showPayAction]="false"></app-repayment-schedule>
          </div>
        </div>
      </div>

      <!-- Tab 2: Transaction History -->
      <div class="tab-content" *ngIf="activeTab() === 'TXNS'">
        <div class="content-card">
          <div class="table-responsive" *ngIf="userTxns().length > 0">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let txn of userTxns()">
                  <td><span class="code-badge">{{ txn.transactionId }}</span></td>
                  <td>{{ txn.date }}</td>
                  <td><span class="cat-pill">{{ txn.category }}</span></td>
                  <td>{{ txn.description }}</td>
                  <td>
                    <span class="badge" [ngClass]="txn.type === 'credit' ? 'badge-success' : 'badge-danger'">
                      {{ txn.type }}
                    </span>
                  </td>
                  <td class="text-right font-bold" [ngClass]="txn.type === 'credit' ? 'text-success' : 'text-danger'">
                    {{ txn.type === 'credit' ? '+' : '-' }}{{ txn.amount | inrCurrency }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <app-empty-state
            *ngIf="userTxns().length === 0"
            title="No transactions yet"
            description="Transactions will appear here when balance top-ups, loans, or repayments occur."
          ></app-empty-state>
        </div>
      </div>

      <!-- Add Amount Modal -->
      <div class="modal-backdrop" *ngIf="isAddAmountOpen()" (click)="isAddAmountOpen.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Add Amount to {{ user()?.name }}</h3>
              <p class="modal-subtitle">Direct credit to member savings account</p>
            </div>
            <button class="btn-close" (click)="isAddAmountOpen.set(false)">✕</button>
          </div>
          <form [formGroup]="addAmountForm" (ngSubmit)="submitAddAmount()" class="modal-form">
            <div class="form-group">
              <label class="form-label">Amount to Add (₹) <span class="required">*</span></label>
              <input type="number" min="1" step="500" class="form-control" formControlName="amount" placeholder="5000" />
            </div>
            <div class="form-group">
              <label class="form-label">Description / Remarks <span class="required">*</span></label>
              <input type="text" class="form-control" formControlName="description" placeholder="Monthly contribution" />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-control" formControlName="date" />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="isAddAmountOpen.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="addAmountForm.invalid">Add Amount</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
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
    .btn-back:hover { background: #F8FAFC; color: #1E293B; }
    .page-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #172033;
      margin: 0;
    }
    .user-id-badge {
      font-family: monospace;
      font-weight: 700;
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.88rem;
      border: 1px solid #DBEAFE;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      font-size: 0.88rem;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-primary { background: #3155C8; color: #ffffff; }
    .btn-primary:hover { background: #2643A3; }
    .btn-secondary { background: #F1F5F9; color: #334155; }

    .profile-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: #3155C8;
      color: #ffffff;
      font-size: 1.8rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .profile-meta-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .meta-label { font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .meta-val { font-size: 0.92rem; font-weight: 600; color: #1E293B; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .stat-box {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .stat-box.primary { border-left: 4px solid #16A34A; }
    .stat-lbl { font-size: 0.76rem; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .stat-val { font-size: 1.6rem; font-weight: 800; color: #172033; }
    .stat-sub { font-size: 0.78rem; color: #94A3B8; }
    .text-success { color: #16A34A !important; }
    .text-danger { color: #DC2626 !important; }

    .tabs-nav {
      display: flex;
      gap: 12px;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 2px;
    }
    .tab-btn {
      padding: 10px 18px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 0.92rem;
      font-weight: 700;
      color: #64748B;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn.active {
      color: #3155C8;
      border-bottom-color: #3155C8;
    }

    .loans-accordion {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .loan-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .loan-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .loan-id-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .loan-id {
      font-family: monospace;
      font-weight: 800;
      font-size: 1.1rem;
      color: #3155C8;
    }
    .loan-purpose {
      font-size: 0.92rem;
      color: #475569;
      font-weight: 600;
    }

    .content-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 20px;
    }
    .table-responsive { overflow-x: auto; }
    .simple-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .simple-table th { background: #F8FAFC; padding: 12px; text-align: left; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; }
    .simple-table td { padding: 12px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
    .code-badge { font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #475569; }
    .cat-pill { font-size: 0.74rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }

    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; }
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
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
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
    .btn-close { background: none; border: none; font-size: 1.1rem; color: #94A3B8; cursor: pointer; }
    .modal-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 0.84rem; font-weight: 600; color: #334155; }
    .required { color: #DC2626; }
    .form-control { width: 100%; height: 42px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #CBD5E1; font-size: 0.9rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `]
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private loanService = inject(LoanService);
  private txnService = inject(TransactionService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  user = signal<User | null>(null);
  userLoans = signal<Loan[]>([]);
  userTxns = signal<Transaction[]>([]);
  activeTab = signal<'LOANS' | 'TXNS'>('LOANS');

  isAddAmountOpen = signal<boolean>(false);

  addAmountForm: FormGroup = this.fb.group({
    amount: [5000, [Validators.required, Validators.min(1)]],
    description: ['Monthly savings contribution', [Validators.required]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]]
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        this.loadUserData(id);
      }
    });
  }

  loadUserData(userId: string): void {
    const u = this.userService.getUserById(userId);
    if (u) {
      this.user.set(u);
      this.userLoans.set(this.loanService.getUserLoans(u.userId));
      this.userTxns.set(this.txnService.getUserTransactions(u.userId));
    }
  }

  totalLoansAmount(): number {
    return this.userLoans().reduce((sum, l) => sum + (l.loanAmount || 0), 0);
  }

  totalPaidAmount(): number {
    return this.userLoans().reduce((sum, l) => sum + (l.paidAmount || 0), 0);
  }

  totalPendingAmount(): number {
    return this.userLoans().reduce((sum, l) => sum + (l.pendingAmount || 0), 0);
  }

  activeLoansCount(): number {
    return this.userLoans().filter(l => l.status === 'Active').length;
  }

  submitAddAmount(): void {
    if (this.addAmountForm.invalid || !this.user()) return;
    const val = this.addAmountForm.value;
    const res = this.userService.addAmount(
      this.user()!.userId,
      Number(val.amount),
      val.description,
      val.date
    );

    this.isAddAmountOpen.set(false);
    if (res.success) {
      this.toast.success(res.message, 'Balance Updated');
      this.loadUserData(this.user()!.userId);
    } else {
      this.toast.error(res.message, 'Failed');
    }
  }
}
