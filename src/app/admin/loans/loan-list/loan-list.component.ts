import { Component, HostListener, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Loan, RepaymentInstallment, earlySettlementAmount, EARLY_CLOSURE_INTEREST_MONTHS } from '../../../core/models/loan.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { RepaymentScheduleComponent } from '../../../shared/components/repayment-schedule/repayment-schedule.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, InrCurrencyPipe, RepaymentScheduleComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Society Loans Management</h1>
          <p class="page-subtitle">Track all disbursed micro-loans, 10-month repayment schedules, and EMIs</p>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar-card">
        <!-- Search Box -->
        <div class="search-box">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search by Loan ID (e.g. LOAN0001), User ID (e.g. SOCITY0001), or Member Name..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
          <button *ngIf="searchQuery()" class="btn-clear" (click)="searchQuery.set('')">✕</button>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-pills">
          <button
            class="filter-pill"
            [class.active]="selectedStatus() === 'ALL'"
            (click)="selectedStatus.set('ALL')"
          >
            All Loans
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedStatus() === 'Active'"
            (click)="selectedStatus.set('Active')"
          >
            Active Loans
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedStatus() === 'Completed'"
            (click)="selectedStatus.set('Completed')"
          >
            Completed Loans
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedStatus() === 'Pending'"
            (click)="selectedStatus.set('Pending')"
          >
            Pending Approval
          </button>
        </div>
      </div>

      <!-- Content Table -->
      <div class="content-card" *ngIf="filteredLoans$ | async as loans">
        <div class="table-responsive desktop-table" *ngIf="loans.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Member (User ID)</th>
                <th>Loan Amount</th>
                <th>Monthly EMI</th>
                <th>Paid Amount</th>
                <th>Pending Amount</th>
                <th>Paid Months</th>
                <th>Remaining</th>
                <th>Loan Date</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let loan of loans">
                <td>
                  <a [routerLink]="['/admin/loans', loan.loanId]" class="loan-id-link">{{ loan.loanId }}</a>
                </td>
                <td>
                  <div class="member-cell">
                    <span class="m-name">{{ loan.userName }}</span>
                    <span class="m-id">{{ loan.userId }}</span>
                  </div>
                </td>
                <td><span class="font-bold">{{ loan.loanAmount | inrCurrency }}</span></td>
                <td><span class="emi-val">{{ loan.monthlyEMI | inrCurrency }}/mo</span></td>
                <td><span class="text-success">{{ loan.paidAmount | inrCurrency }}</span></td>
                <td><span class="text-danger">{{ loan.pendingAmount | inrCurrency }}</span></td>
                <td>
                  <div class="months-progress">
                    <span class="paid-badge">{{ loan.paidMonths }}/{{ loan.totalMonths }}</span>
                  </div>
                </td>
                <td><span class="text-muted">{{ loan.remainingMonths }} mo</span></td>
                <td><span class="date-cell">{{ loan.loanDate }}</span></td>
                <td>
                  <span class="badge" [ngClass]="loan.status === 'Completed' ? 'badge-success' : (loan.status === 'Rejected' ? 'badge-danger' : (loan.status === 'Pending' ? 'badge-pending' : 'badge-warning'))">
                    {{ loan.status }}
                  </span>
                </td>
                <td class="text-right">
                  <button
                    class="btn-action btn-menu"
                    [class.open]="menuLoan()?.loanId === loan.loanId"
                    [disabled]="clearingId() === loan.loanId"
                    (click)="toggleMenu(loan, $event)"
                  >
                    {{ clearingId() === loan.loanId ? 'Processing...' : 'Actions' }}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-cards-grid" *ngIf="loans.length > 0">
          <div *ngFor="let loan of loans" class="mobile-loan-card">
            <div class="m-loan-header">
              <div class="m-loan-id-box">
                <span class="loan-id-link">{{ loan.loanId }}</span>
                <span class="m-loan-user">{{ loan.userName }} ({{ loan.userId }})</span>
              </div>
              <span class="badge" [ngClass]="loan.status === 'Completed' ? 'badge-success' : (loan.status === 'Rejected' ? 'badge-danger' : (loan.status === 'Pending' ? 'badge-pending' : 'badge-warning'))">
                {{ loan.status }}
              </span>
            </div>

            <div class="m-loan-stats">
              <div class="stat-cell">
                <span class="lbl">Loan Amount</span>
                <span class="val font-bold">{{ loan.loanAmount | inrCurrency }}</span>
              </div>
              <div class="stat-cell">
                <span class="lbl">Monthly EMI</span>
                <span class="val">{{ loan.monthlyEMI | inrCurrency }}</span>
              </div>
              <div class="stat-cell">
                <span class="lbl">Paid Amount</span>
                <span class="val text-success">{{ loan.paidAmount | inrCurrency }} ({{ loan.paidMonths }}/{{ loan.totalMonths }})</span>
              </div>
              <div class="stat-cell">
                <span class="lbl">Pending Amount</span>
                <span class="val text-danger">{{ loan.pendingAmount | inrCurrency }}</span>
              </div>
            </div>

            <div class="m-card-footer">
              <button
                class="btn-action btn-menu flex-1 text-center"
                [class.open]="menuLoan()?.loanId === loan.loanId"
                [disabled]="clearingId() === loan.loanId"
                (click)="toggleMenu(loan, $event)"
              >
                {{ clearingId() === loan.loanId ? 'Processing...' : 'Actions' }}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          </div>
        </div>

        <app-empty-state
          *ngIf="loans.length === 0"
          title="No loans found"
          description="No loan applications or records match your search filter."
          actionText="Clear Filter"
          (action)="clearFilter()"
        ></app-empty-state>
      </div>

      <!-- Actions dropdown (fixed position so the table's scroll area can't clip it) -->
      <ng-container *ngIf="menuLoan() as m">
        <div class="menu-backdrop" (click)="closeMenu()"></div>
        <div class="action-menu" [style.top.px]="menuPos().top" [style.left.px]="menuPos().left">
          <button class="menu-item" (click)="closeMenu(); openScheduleModal(m)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            View Schedule
          </button>
          <a class="menu-item" [routerLink]="['/admin/loans', m.loanId]" (click)="closeMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            View Details
          </a>
          <ng-container *ngIf="m.status === 'Pending'">
            <div class="menu-divider"></div>
            <button class="menu-item item-success" (click)="closeMenu(); approveLoan(m)">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Approve Loan
            </button>
            <button class="menu-item item-danger" (click)="closeMenu(); rejectLoan(m)">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              Reject Loan
            </button>
          </ng-container>
          <ng-container *ngIf="m.status === 'Active'">
            <div class="menu-divider"></div>
            <button class="menu-item item-success" (click)="closeMenu(); clearLoan(m)">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Clear Loan
            </button>
          </ng-container>
        </div>
      </ng-container>

      <!-- Schedule Modal -->
      <div class="modal-backdrop" *ngIf="selectedLoanForModal()" (click)="selectedLoanForModal.set(null)">
        <div class="modal-dialog-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Repayment Schedule</h3>
              <p class="modal-subtitle">
                Loan <b>{{ selectedLoanForModal()?.loanId }}</b> — Member: {{ selectedLoanForModal()?.userName }} ({{ selectedLoanForModal()?.userId }})
              </p>
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
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #172033;
      margin: 0;
    }
    .page-subtitle {
      font-size: 0.88rem;
      color: #64748B;
      margin: 4px 0 0;
    }

    .toolbar-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      color: #94A3B8;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      height: 44px;
      padding: 10px 38px 10px 42px;
      border-radius: 10px;
      border: 1.5px solid #E2E8F0;
      background: #F8FAFC;
      font-size: 0.9rem;
      color: #172033;
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: #3155C8;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(49, 85, 200, 0.1);
    }
    .btn-clear {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94A3B8;
      cursor: pointer;
    }

    .filter-pills {
      display: flex;
      gap: 8px;
    }
    .filter-pill {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-pill.active {
      background: #3155C8;
      color: #ffffff;
      border-color: #3155C8;
    }

    .content-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    .table-responsive { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .data-table th {
      background: #F8FAFC;
      padding: 14px 16px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #E2E8F0;
      white-space: nowrap;
    }
    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
      vertical-align: middle;
    }
    .data-table tr:hover { background: #FAFCFF; }

    .loan-id-link {
      font-family: monospace;
      font-weight: 800;
      color: #3155C8;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .loan-id-link:hover { text-decoration: underline; }

    .member-cell { display: flex; flex-direction: column; }
    .m-name { font-weight: 700; color: #172033; }
    .m-id { font-size: 0.74rem; color: #64748B; font-family: monospace; }
    .font-bold { font-weight: 700; }
    .emi-val { font-weight: 600; color: #334155; }
    .text-success { color: #16A34A !important; font-weight: 700; }
    .text-danger { color: #DC2626 !important; font-weight: 700; }
    .text-muted { color: #94A3B8; }
    .date-cell { font-size: 0.82rem; color: #64748B; }
    .text-right { text-align: right; }

    .months-progress { display: flex; align-items: center; }
    .paid-badge {
      background: #EFF6FF;
      color: #1D4ED8;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #DBEAFE;
    }

    .badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
    }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-warning { background: #FEF3C7; color: #B45309; }
    .badge-danger { background: #FEE2E2; color: #DC2626; }
    .badge-pending { background: #E0E7FF; color: #4338CA; }
    .btn-action {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .btn-menu { background: #F1F5F9; color: #334155; border-color: #E2E8F0; white-space: nowrap; }
    .btn-menu:hover:not(:disabled), .btn-menu.open { background: #3155C8; color: #ffffff; border-color: #3155C8; }
    .btn-menu:disabled { opacity: 0.6; cursor: not-allowed; }

    .menu-backdrop { position: fixed; inset: 0; z-index: 1000; }
    .action-menu {
      position: fixed;
      z-index: 1001;
      width: 190px;
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
      padding: 6px;
      display: flex;
      flex-direction: column;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      border: none;
      background: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      text-decoration: none;
      text-align: left;
      cursor: pointer;
    }
    .menu-item:hover { background: #F1F5F9; }
    .item-success { color: #15803D; }
    .item-success:hover { background: #DCFCE7; }
    .item-danger { color: #DC2626; }
    .item-danger:hover { background: #FEE2E2; }
    .menu-divider { height: 1px; background: #E2E8F0; margin: 4px 0; }

    /* Mobile Cards */
    .mobile-cards-grid {
      display: none;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }
    .mobile-loan-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .m-loan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .m-loan-id-box { display: flex; flex-direction: column; }
    .m-loan-user { font-size: 0.78rem; color: #64748B; }

    .m-loan-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .stat-cell {
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      display: flex;
      flex-direction: column;
    }
    .stat-cell .lbl { font-size: 0.7rem; color: #64748B; font-weight: 600; text-transform: uppercase; }
    .stat-cell .val { font-size: 0.95rem; margin-top: 2px; }

    .m-card-footer { display: flex; gap: 8px; }
    .flex-1 { flex: 1; }
    .text-center { justify-content: center; text-align: center; }

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
    .modal-body-scroll {
      padding: 24px;
      overflow-y: auto;
    }

    @media (max-width: 900px) {
      .desktop-table { display: none; }
      .mobile-cards-grid { display: flex; }
    }
  `]
})
export class LoanListComponent {
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);

  clearingId = signal<string | null>(null);
  menuLoan = signal<Loan | null>(null);
  menuPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  toggleMenu(loan: Loan, event: MouseEvent): void {
    if (this.menuLoan()?.loanId === loan.loanId) {
      this.closeMenu();
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 200;
    // Open below the button, right-aligned; flip above if it would run off the bottom of the screen
    const top = rect.bottom + menuHeight > window.innerHeight ? rect.top - menuHeight - 4 : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    this.menuPos.set({ top: Math.max(8, top), left });
    this.menuLoan.set(loan);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  closeMenu(): void {
    this.menuLoan.set(null);
  }

  async approveLoan(loan: Loan): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Approve Loan',
      message: `Approve loan ${loan.loanId} of ₹${loan.loanAmount.toLocaleString('en-IN')} for ${loan.userName} (${loan.userId})?\n\nPurpose: ${loan.loanPurpose}\nRepayable: ₹${(loan.totalPayable || loan.loanAmount).toLocaleString('en-IN')} in ${loan.totalMonths} EMIs of ₹${(loan.monthlyEMI || 0).toLocaleString('en-IN')}\n\nThe amount will be given from society funds and EMIs start from the 15th of next month.`,
      confirmText: 'Yes, Approve',
      cancelText: 'Cancel',
      type: 'success'
    });
    if (!ok) return;
    this.clearingId.set(loan.loanId);
    const res = await this.loanService.approveLoan(loan.loanId);
    this.clearingId.set(null);
    res.success ? this.toast.success(res.message, 'Loan Approved') : this.toast.error(res.message, 'Approval Failed');
  }

  async rejectLoan(loan: Loan): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Reject Loan',
      message: `Reject loan application ${loan.loanId} of ₹${loan.loanAmount.toLocaleString('en-IN')} for ${loan.userName} (${loan.userId})?`,
      confirmText: 'Yes, Reject',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!ok) return;
    this.clearingId.set(loan.loanId);
    const res = await this.loanService.rejectLoan(loan.loanId);
    this.clearingId.set(null);
    res.success ? this.toast.info(res.message, 'Loan Rejected') : this.toast.error(res.message, 'Reject Failed');
  }

  async clearLoan(loan: Loan): Promise<void> {
    const remaining = loan.totalMonths - loan.paidMonths;
    const amount = earlySettlementAmount(loan);
    const ok = await this.confirm.confirm({
      title: 'Clear Loan',
      message: `Clear loan ${loan.loanId} of ${loan.userName} (${loan.userId})?\n\nRemaining EMIs: ${remaining}\nPending (full): ₹${loan.pendingAmount.toLocaleString('en-IN')}\nEarly clearance amount (principal + ${Math.min(EARLY_CLOSURE_INTEREST_MONTHS, remaining)} months interest): ₹${amount.toLocaleString('en-IN')}\nInterest waived: ₹${(loan.pendingAmount - amount).toLocaleString('en-IN')}\n\nAll remaining EMIs will be marked paid and the loan will be closed. The member can then take a new loan.`,
      confirmText: 'Yes, Clear Loan',
      cancelText: 'Cancel',
      type: 'success'
    });
    if (!ok) return;

    this.clearingId.set(loan.loanId);
    const res = await this.paymentService.settleLoan(loan.loanId);
    this.clearingId.set(null);
    res.success ? this.toast.success(res.message, 'Loan Cleared') : this.toast.error(res.message, 'Clear Failed');
  }

  searchQuery = signal<string>('');
  selectedStatus = signal<'ALL' | 'Active' | 'Completed' | 'Pending'>('ALL');
  selectedLoanForModal = signal<Loan | null>(null);

  filteredLoans$: Observable<Loan[]> = combineLatest([
    this.loanService.getAllLoans$(),
    toObservable(this.searchQuery),
    toObservable(this.selectedStatus)
  ]).pipe(
    map(([loans, query, status]) => {
      const q = query.toLowerCase().trim();

      return loans.filter(l => {
        const matchesQ = !q ||
          l.loanId.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q);

        if (!matchesQ) return false;

        if (status === 'ALL') return true;
        return l.status === status;
      });
    })
  );

  openScheduleModal(loan: Loan): void {
    this.selectedLoanForModal.set(loan);
  }

  clearFilter(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('ALL');
  }
}
