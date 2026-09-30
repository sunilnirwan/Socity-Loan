import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { LoanService } from '../../../core/services/loan.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserSummary, User } from '../../../core/models/user.model';
import { MONTHLY_DEPOSIT, LATE_FEE, DUE_DAY, depositFor } from '../../../core/models/loan.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Observable, combineLatest, map, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, InrCurrencyPipe, EmptyStateComponent],
  host: {
    '(document:click)': 'menu.set(null)',
    '(document:keydown.escape)': 'menu.set(null)',
    '(window:scroll)': 'menu.set(null)',
    '(window:resize)': 'menu.set(null)'
  },
  template: `
    <!-- Row Actions Dropdown (fixed so the table's overflow doesn't clip it) -->
    <div *ngIf="menu() as m" class="action-menu" role="menu" [style.top.px]="m.top" [style.right.px]="m.right" (click)="$event.stopPropagation()">
      <button role="menuitem" (click)="menu.set(null); openAddAmountModal(m.user)">+ Add Amount</button>
      <button role="menuitem" (click)="menu.set(null); router.navigate(['/admin/users', m.user.uid || m.user.userId])">View Profile</button>
      <button role="menuitem" (click)="menu.set(null); router.navigate(['/admin/users', m.user.uid || m.user.userId], { queryParams: { edit: 1 } })">Edit Member</button>
      <button *ngIf="isAdmin()" role="menuitem" class="danger" (click)="menu.set(null); deleteMember(m.user)">Delete</button>
    </div>

    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Society Members & Users</h1>
          <p class="page-subtitle">Manage member balances, track loan statuses, and add contributions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAddUserModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            <span>Register New Member</span>
          </button>
          <button class="btn btn-secondary" (click)="bulkOpen.set(!bulkOpen())">Bulk Add</button>
        </div>
      </div>

      <div class="toolbar-card" *ngIf="bulkOpen()" style="flex-direction: column; align-items: stretch; gap: 8px;">
        <small>One member per line: <b>Name, email, shares</b> (shares optional). Password for all: 123456</small>
        <textarea #bulkText rows="10" class="form-control" placeholder="गजानन्द, gajanand@yopmail.com, 1"></textarea>
        <button class="btn btn-primary" [disabled]="isSubmitting()" (click)="bulkAdd(bulkText.value)">
          {{ isSubmitting() ? bulkProgress() : 'Add All Members' }}
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar-card">
        <!-- Search Box -->
        <div class="search-box">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search by User ID, Name, Mobile, or Email..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
          <button *ngIf="searchQuery()" class="btn-clear" (click)="searchQuery.set('')">✕</button>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-pills">
          <button
            class="filter-pill"
            [class.active]="selectedFilter() === 'ALL'"
            (click)="selectedFilter.set('ALL')"
          >
            All Members
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedFilter() === 'LOAN_ACTIVE'"
            (click)="selectedFilter.set('LOAN_ACTIVE')"
          >
            Active Loans
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedFilter() === 'LOAN_TAKEN'"
            (click)="selectedFilter.set('LOAN_TAKEN')"
          >
            Loan Taken
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedFilter() === 'NO_LOAN'"
            (click)="selectedFilter.set('NO_LOAN')"
          >
            No Loans
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedFilter() === 'LOAN_COMPLETED'"
            (click)="selectedFilter.set('LOAN_COMPLETED')"
          >
            Completed Loans
          </button>
        </div>
      </div>

      <!-- Data View -->
      <div class="content-card" *ngIf="filteredUsers$ | async as users">
        <!-- Desktop / Tablet Table View -->
        <div class="table-responsive desktop-table" *ngIf="users.length > 0">
          <table class="user-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Member Name</th>
                <th>Contact</th>
                <th>Total Amount</th>
                <th>Loan Amount</th>
                <th>Paid Amount</th>
                <th>Pending Amount</th>
                <th>Loan Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of getPaginatedUsers(users); let i = index">
                <td class="text-muted">{{ (currentPage() - 1) * pageSize() + i + 1 }}</td>
                <td>
                  <span class="date-cell">{{ item.user.createdAt | date:'dd/MM/yyyy' }}</span>
                </td>
                <td>
                  <div class="user-name-cell">
                    <span class="u-name">{{ item.user.name }} <span class="shares-badge" *ngIf="(item.user.shares || 1) > 1">{{ item.user.shares }} shares</span></span>
                    <span class="u-occ" *ngIf="item.user.occupation">{{ item.user.occupation }}</span>
                  </div>
                </td>
                <td>
                  <div class="contact-cell">
                    <span class="u-phone">{{ item.user.mobile }}</span>
                    <span class="u-email">{{ item.user.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="balance-cell">{{ item.user.totalAmount | inrCurrency }}</span>
                </td>
                <td>
                  <span class="font-bold">{{ item.totalLoansAmount | inrCurrency }}</span>
                </td>
                <td>
                  <span class="text-success">{{ item.paidLoanAmount | inrCurrency }}</span>
                </td>
                <td>
                  <span class="text-danger">{{ item.pendingLoanAmount | inrCurrency }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getLoanBadgeClass(item.loanStatus)">
                    {{ item.loanStatus }}
                  </span>
                </td>
                
                <td class="text-right">
                  <button class="btn-action btn-view" (click)="toggleMenu(item.user, $event)" aria-haspopup="menu" [attr.aria-expanded]="menu()?.user === item.user">
                    {{ deletingId() === item.user.userId ? 'Deleting...' : 'Actions ▾' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View (shown only on small screens) -->
        <div class="mobile-cards-grid" *ngIf="users.length > 0">
          <div *ngFor="let item of getPaginatedUsers(users)" class="mobile-user-card">
            <div class="m-card-header">
              <div class="m-user-main">
                <span class="user-id-badge">{{ item.user.userId }}</span>
                <span class="u-name-mobile">{{ item.user.name }} <span class="shares-badge" *ngIf="(item.user.shares || 1) > 1">{{ item.user.shares }} shares</span></span>
              </div>
              <span class="badge" [ngClass]="getLoanBadgeClass(item.loanStatus)">
                {{ item.loanStatus }}
              </span>
            </div>

            <div class="m-card-body">
              <div class="m-row">
                <span class="m-label">Phone & Email:</span>
                <span class="m-val">{{ item.user.mobile }} • {{ item.user.email }}</span>
              </div>
              <div class="m-stats-grid">
                <div class="m-stat-box">
                  <span class="lbl">Account Balance</span>
                  <span class="val text-primary">{{ item.user.totalAmount | inrCurrency }}</span>
                </div>
                <div class="m-stat-box">
                  <span class="lbl">Total Loan</span>
                  <span class="val">{{ item.totalLoansAmount | inrCurrency }}</span>
                </div>
                <div class="m-stat-box">
                  <span class="lbl">Paid</span>
                  <span class="val text-success">{{ item.paidLoanAmount | inrCurrency }}</span>
                </div>
                <div class="m-stat-box">
                  <span class="lbl">Pending</span>
                  <span class="val text-danger">{{ item.pendingLoanAmount | inrCurrency }}</span>
                </div>
              </div>
            </div>

            <div class="m-card-footer">
              <button
                class="btn-action btn-add-amt flex-1"
                (click)="openAddAmountModal(item.user)"
              >
                + Add Amount
              </button>
              <a
                [routerLink]="['/admin/users', item.user.uid || item.user.userId]"
                class="btn-action btn-view flex-1 text-center"
              >
                View Profile
              </a>
              <button
                *ngIf="isAdmin()"
                class="btn-action btn-delete flex-1"
                [disabled]="deletingId() === item.user.userId"
                (click)="deleteMember(item.user)"
              >
                {{ deletingId() === item.user.userId ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <app-empty-state
          *ngIf="users.length === 0"
          title="No members match your criteria"
          description="Try modifying your search keywords or switching filter tabs."
          actionText="Clear Filters"
          (action)="clearFilters()"
        ></app-empty-state>

        <!-- Pagination -->
        <div class="pagination-footer" *ngIf="users.length > pageSize()">
          <div class="pagination-info">
            Showing {{ (currentPage() - 1) * pageSize() + 1 }} -
            {{ Math.min(currentPage() * pageSize(), users.length) }} of {{ users.length }} members
          </div>
          <div class="pagination-controls">
            <button
              class="btn-page"
              [disabled]="currentPage() === 1"
              (click)="currentPage.update(p => p - 1)"
            >
              Previous
            </button>
            <span class="page-indicator">Page {{ currentPage() }} of {{ getTotalPages(users.length) }}</span>
            <button
              class="btn-page"
              [disabled]="currentPage() >= getTotalPages(users.length)"
              (click)="currentPage.update(p => p + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- MODAL: ADD AMOUNT TO USER                    -->
      <!-- ============================================ -->
      <div class="modal-backdrop" *ngIf="isAddAmountModalOpen()" (click)="closeAddAmountModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Add Amount to Member Account</h3>
              <p class="modal-subtitle">Credit member savings, deposit, or monthly contribution</p>
            </div>
            <button class="btn-close" (click)="closeAddAmountModal()">✕</button>
          </div>

          <form [formGroup]="addAmountForm" (ngSubmit)="submitAddAmount()" class="modal-form">
            <!-- User Info Preview -->
            <div class="modal-user-summary">
              <div class="user-summary-row">
                <span class="lbl">Member Name:</span>
                <span class="val font-bold">{{ selectedUser()?.name }}</span>
              </div>
              <div class="user-summary-row">
                <span class="lbl">User ID:</span>
                <span class="val user-id-badge">{{ selectedUser()?.userId }}</span>
              </div>
              <div class="user-summary-row">
                <span class="lbl">Current Account Balance:</span>
                <span class="val text-success font-bold">{{ (selectedUser()?.totalAmount || 0) | inrCurrency }}</span>
              </div>
            </div>

            <!-- Amount to Add -->
            <div class="form-group">
              <label class="form-label" for="add-amt">
                Amount to Add (₹) <span class="required">*</span>
              </label>
              <div class="input-with-symbol">
                <span class="currency-symbol">₹</span>
                <input
                  id="add-amt"
                  type="number"
                  min="1"
                  step="500"
                  class="form-control"
                  formControlName="amount"
                  placeholder="e.g. 5000"
                />
              </div>
              <div class="quick-amt-pills">
                <button type="button" class="amt-chip" (click)="setAmount(1000)">+₹1,000</button>
                <button type="button" class="amt-chip" (click)="setAmount(2000)">+₹2,000</button>
                <button type="button" class="amt-chip" (click)="setAmount(5000)">+₹5,000</button>
                <button type="button" class="amt-chip" (click)="setAmount(10000)">+₹10,000</button>
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label" for="add-desc">
                Description / Purpose <span class="required">*</span>
              </label>
              <input
                id="add-desc"
                type="text"
                class="form-control"
                formControlName="description"
                placeholder="e.g. Monthly contribution / Society share capital"
              />
            </div>

            <!-- Date -->
            <div class="form-group">
              <label class="form-label" for="add-date">Transaction Date</label>
              <input
                id="add-date"
                type="date"
                class="form-control"
                formControlName="date"
              />
            </div>

            <label class="late-fee-check">
              <input type="checkbox" formControlName="lateFee" />
              <span>Late payment (after {{ dueDay }}th): add ₹{{ lateFee }} late fee</span>
            </label>

            <!-- New Estimated Balance Banner -->
            <div class="balance-preview-box" *ngIf="addAmountForm.get('amount')?.value > 0">
              <span>New Total Balance will be:</span>
              <b>{{ ((selectedUser()?.totalAmount || 0) + (addAmountForm.get('amount')?.value || 0)) | inrCurrency }}</b>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeAddAmountModal()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="addAmountForm.invalid || isSubmitting()"
              >
                {{ isSubmitting() ? 'Saving...' : 'Add Amount to User' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- MODAL: REGISTER NEW USER DIRECTLY            -->
      <!-- ============================================ -->
      <div class="modal-backdrop" *ngIf="isAddUserModalOpen()" (click)="!isSubmitting() && closeAddUserModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Register New Society Member</h3>
              <p class="modal-subtitle">Will auto-assign Member ID: <b>{{ nextAssignedId() }}</b></p>
            </div>
            <button class="btn-close" (click)="closeAddUserModal()" [disabled]="isSubmitting()">✕</button>
          </div>

          <form [formGroup]="registerUserForm" (ngSubmit)="submitRegisterUser()" class="modal-form">
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input type="text" class="form-control" formControlName="name" placeholder="Full name" />
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label class="form-label">Mobile (10 Digits) <span class="required">*</span></label>
                <input type="tel" maxlength="10" class="form-control" formControlName="mobile" placeholder="9876543210" />
              </div>
              <div class="form-group col">
                <label class="form-label">Email <span class="required">*</span></label>
                <input type="email" class="form-control" formControlName="email" placeholder="email@gmail.com" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label class="form-label">Password <span class="required">*</span></label>
                <input type="password" class="form-control" formControlName="password" placeholder="Min 6 chars" />
              </div>
              <div class="form-group col">
                <label class="form-label">Occupation</label>
                <input type="text" class="form-control" formControlName="occupation" placeholder="Occupation" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Shares <span class="required">*</span></label>
              <input type="number" min="1" max="20" step="1" class="form-control" formControlName="shares" />
              <small class="shares-hint">Monthly deposit: {{ ((registerUserForm.get('shares')?.value || 1) * monthlyDepositPerShare) | inrCurrency }} ({{ registerUserForm.get('shares')?.value || 1 }} × {{ monthlyDepositPerShare | inrCurrency }})</small>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeAddUserModal()" [disabled]="isSubmitting()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="registerUserForm.invalid || isSubmitting()">
                <span *ngIf="isSubmitting()" class="btn-spinner"></span>
                {{ isSubmitting() ? 'Registering...' : 'Register Member' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shares-badge { font-size: 0.7rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: #EDE9FE; color: #6D28D9; margin-left: 4px; }
    .shares-hint { display: block; margin-top: 4px; font-size: 0.78rem; color: #64748B; }
    .late-fee-check { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: #B45309; font-weight: 600; cursor: pointer; margin-bottom: 12px; }
    .late-fee-check input { width: 16px; height: 16px; accent-color: #B45309; }
    .btn-spinner {
      display: inline-block; width: 14px; height: 14px; margin-right: 6px; vertical-align: -2px;
      border: 2px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; border-radius: 50%;
      animation: btn-spin 0.7s linear infinite;
    }
    @keyframes btn-spin { to { transform: rotate(360deg); } }
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
      text-decoration: none;
    }
    .btn-primary {
      background: #3155C8;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(49, 85, 200, 0.25);
    }
    .btn-primary:hover {
      background: #2643A3;
    }
    .btn-secondary {
      background: #F1F5F9;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #E2E8F0;
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
      font-size: 0.85rem;
    }

    .filter-pills {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
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
      white-space: nowrap;
      transition: all 0.15s;
    }
    .filter-pill:hover {
      background: #F1F5F9;
      color: #1E293B;
    }
    .filter-pill.active {
      background: #3155C8;
      color: #ffffff;
      border-color: #3155C8;
      box-shadow: 0 2px 6px rgba(49, 85, 200, 0.3);
    }

    .content-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }
    .user-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .user-table th {
      background: #F8FAFC;
      padding: 14px 16px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #E2E8F0;
      white-space: nowrap;
    }
    .user-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
      vertical-align: middle;
    }
    .user-table tr:hover {
      background: #FAFCFF;
    }

    .user-id-badge {
      font-family: monospace;
      font-weight: 700;
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.82rem;
      border: 1px solid #DBEAFE;
    }
    .user-name-cell {
      display: flex;
      flex-direction: column;
    }
    .u-name { font-weight: 700; color: #172033; }
    .u-occ { font-size: 0.74rem; color: #64748B; }

    .contact-cell {
      display: flex;
      flex-direction: column;
    }
    .u-phone { font-weight: 600; font-size: 0.84rem; color: #334155; }
    .u-email { font-size: 0.76rem; color: #64748B; }

    .balance-cell {
      font-weight: 800;
      color: #16A34A;
    }
    .font-bold { font-weight: 700; }
    .text-success { color: #16A34A; font-weight: 700; }
    .text-danger { color: #DC2626; font-weight: 700; }
    .date-cell { font-size: 0.82rem; color: #64748B; }
    .text-muted { color: #94A3B8; }
    .text-right { text-align: right; }

    .badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-active { background: #FEF3C7; color: #B45309; }
    .badge-completed { background: #DCFCE7; color: #15803D; }
    .badge-none { background: #F1F5F9; color: #64748B; }

    .action-menu {
      position: fixed;
      z-index: 1000;
      min-width: 170px;
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
      padding: 6px;
      display: flex;
      flex-direction: column;
    }
    .action-menu button {
      background: none;
      border: none;
      text-align: left;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }
    .action-menu button:hover { background: #F1F5F9; }
    .action-menu .danger { color: #DC2626; }
    .action-menu .danger:hover { background: #FEF2F2; }
    .action-btn-group {
      display: inline-flex;
      gap: 6px;
      justify-content: flex-end;
    }
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
    .btn-delete {
      background: #FEF2F2;
      color: #DC2626;
      border-color: #FECACA;
    }
    .btn-delete:hover:not(:disabled) {
      background: #DC2626;
      color: #ffffff;
    }
    .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-add-amt {
      background: #EEF2FF;
      color: #3155C8;
      border-color: #C7D2FE;
    }
    .btn-add-amt:hover {
      background: #3155C8;
      color: #ffffff;
    }
    .btn-view {
      background: #F1F5F9;
      color: #334155;
    }
    .btn-view:hover {
      background: #E2E8F0;
    }

    /* Mobile Cards View */
    .mobile-cards-grid {
      display: none;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }
    .mobile-user-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .m-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .m-user-main {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .u-name-mobile {
      font-weight: 700;
      color: #172033;
    }
    .m-row {
      display: flex;
      gap: 6px;
      font-size: 0.82rem;
    }
    .m-label { color: #64748B; font-weight: 600; }
    .m-val { color: #334155; }

    .m-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 6px;
    }
    .m-stat-box {
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      display: flex;
      flex-direction: column;
    }
    .m-stat-box .lbl { font-size: 0.7rem; color: #64748B; font-weight: 600; text-transform: uppercase; }
    .m-stat-box .val { font-size: 0.95rem; font-weight: 800; color: #172033; margin-top: 2px; }

    .m-card-footer {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .flex-1 { flex: 1; }
    .text-center { text-align: center; justify-content: center; }

    .pagination-footer {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      flex-wrap: wrap;
      gap: 12px;
    }
    .pagination-info {
      font-size: 0.84rem;
      color: #64748B;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-page {
      background: #ffffff;
      border: 1px solid #CBD5E1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }
    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .page-indicator {
      font-size: 0.84rem;
      font-weight: 600;
      color: #334155;
    }

    /* Modal Styles */
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
      animation: fadeIn 0.2s ease-out;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: 18px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
    .btn-close {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #94A3B8;
      cursor: pointer;
      padding: 4px;
    }

    .modal-form {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-user-summary {
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .user-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    .user-summary-row .lbl { color: #64748B; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-row .col { flex: 1; }
    .form-label {
      font-size: 0.84rem;
      font-weight: 600;
      color: #334155;
    }
    .required { color: #DC2626; }
    .form-control {
      width: 100%;
      height: 42px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1.5px solid #CBD5E1;
      font-size: 0.9rem;
      color: #172033;
      outline: none;
    }
    .form-control:focus {
      border-color: #3155C8;
      box-shadow: 0 0 0 3px rgba(49, 85, 200, 0.12);
    }
    .input-with-symbol {
      position: relative;
      display: flex;
      align-items: center;
    }
    .currency-symbol {
      position: absolute;
      left: 12px;
      font-weight: 700;
      color: #64748B;
    }
    .input-with-symbol .form-control {
      padding-left: 30px;
    }

    .quick-amt-pills {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .amt-chip {
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #3155C8;
      cursor: pointer;
    }
    .amt-chip:hover {
      background: #EEF2FF;
      border-color: #3155C8;
    }

    .balance-preview-box {
      background: #DCFCE7;
      border: 1px solid #BBF7D0;
      color: #15803D;
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }

    @media (max-width: 900px) {
      .desktop-table {
        display: none;
      }
      .mobile-cards-grid {
        display: flex;
      }
    }
  `]
})
export class UserListComponent {
  private userService = inject(UserService);
  private loanService = inject(LoanService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private confirm = inject(ConfirmDialogService);
  private role = toSignal(inject(AuthService).getUserRole$());

  isAdmin = () => this.role() === 'admin';
  deletingId = signal<string | null>(null);
  router = inject(Router);
  menu = signal<{ user: User; top: number; right: number } | null>(null);

  toggleMenu(user: User, event: MouseEvent): void {
    event.stopPropagation();
    if (this.menu()?.user === user) {
      this.menu.set(null);
      return;
    }
    const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // Open upward when too close to the bottom of the screen
    const top = r.bottom + 190 > window.innerHeight ? r.top - 190 : r.bottom + 4;
    this.menu.set({ user, top, right: window.innerWidth - r.right });
  }

  async deleteMember(user: User): Promise<void> {
    const hasActiveLoan = this.loanService.getUserLoans(user.uid || user.userId).some(l => l.status === 'Active' || l.status === 'Pending');
    if (hasActiveLoan) {
      this.toast.error(`${user.name} has an active or pending loan. Close or reject it before deleting the member.`, 'Cannot Delete');
      return;
    }
    const hasPendingPayment = (await firstValueFrom(this.paymentService.getAllPayments$()))
      .some(p => (user.uid ? p.userUid === user.uid : p.userId === user.userId) && p.status === 'Pending');
    if (hasPendingPayment) {
      this.toast.error(`${user.name} has a payment waiting for approval. Approve or reject it first.`, 'Cannot Delete');
      return;
    }

    const ok = await this.confirm.confirm({
      title: 'Delete Member',
      message: `Delete ${user.name} (${user.userId})?\n\nDeposit balance: ₹${(user.totalAmount || 0).toLocaleString('en-IN')}\nThe member will no longer be able to log in. Their loan and transaction history is kept.\n\nThis cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!ok) return;

    this.deletingId.set(user.userId);
    const res = await this.userService.deleteUser(user);
    this.deletingId.set(null);
    res.success ? this.toast.success(res.message, 'Member Deleted') : this.toast.error(res.message, 'Delete Failed');
  }

  Math = Math;

  searchQuery = signal<string>('');
  selectedFilter = signal<'ALL' | 'LOAN_ACTIVE' | 'LOAN_TAKEN' | 'NO_LOAN' | 'LOAN_COMPLETED'>('ALL');
  currentPage = signal<number>(1);
  pageSize = signal<number>(100);

  // Add Amount Modal State
  isAddAmountModalOpen = signal<boolean>(false);
  selectedUser = signal<User | null>(null);
  isSubmitting = signal<boolean>(false);

  // Add User Modal State
  isAddUserModalOpen = signal<boolean>(false);
  nextAssignedId = signal<string>('SOCITY0001');

  addAmountForm: FormGroup = this.fb.group({
    amount: [MONTHLY_DEPOSIT, [Validators.required, Validators.min(1)]],
    description: ['Monthly contribution / deposit', [Validators.required]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    lateFee: [false]
  });
  lateFee = LATE_FEE;
  dueDay = DUE_DAY;

  registerUserForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['user@123', [Validators.required, Validators.minLength(6)]],
    occupation: ['Member'],
    address: ['Jaipur, Rajasthan'],
    shares: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
  });
  monthlyDepositPerShare = MONTHLY_DEPOSIT;

  filteredUsers$: Observable<UserSummary[]> = combineLatest([
    this.userService.getUsers$(),
    this.loanService.getLoans$()
  ]).pipe(
    map(([allUsers, loans]) => {
      // Exclude admin accounts
      const members = allUsers.filter(u => u.role !== 'admin');

      const summaries: UserSummary[] = members.map(user => {
        // Match by Firebase UID (unique); Member ID only for legacy records without a UID
        const userLoans = loans.filter(l =>
          user.uid && l.userUid ? l.userUid === user.uid : l.userId.toUpperCase() === user.userId.toUpperCase()
        );
        const totalLoansAmount = userLoans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
        const paidLoanAmount = userLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
        const pendingLoanAmount = userLoans.reduce((sum, l) => sum + (l.pendingAmount || 0), 0);
        const activeLoans = userLoans.filter(l => (l.status || '').toLowerCase() === 'active');
        const completedLoans = userLoans.filter(l => (l.status || '').toLowerCase() === 'completed');

        let loanStatus: 'No Loan' | 'Loan Active' | 'Loan Completed' = 'No Loan';
        if (activeLoans.length > 0) {
          loanStatus = 'Loan Active';
        } else if (completedLoans.length > 0) {
          loanStatus = 'Loan Completed';
        }

        return {
          user,
          totalLoansAmount,
          activeLoansCount: activeLoans.length,
          completedLoansCount: completedLoans.length,
          paidLoanAmount,
          pendingLoanAmount,
          loanStatus
        };
      });

      const q = this.searchQuery().toLowerCase().trim();
      const filter = this.selectedFilter();

      return summaries.filter(item => {
        // Search match
        const matchesQuery = !q ||
          item.user.userId.toLowerCase().includes(q) ||
          item.user.name.toLowerCase().includes(q) ||
          item.user.mobile.includes(q) ||
          item.user.email.toLowerCase().includes(q);

        if (!matchesQuery) return false;

        // Filter tab
        if (filter === 'ALL') return true;
        if (filter === 'LOAN_ACTIVE') return item.loanStatus === 'Loan Active';
        if (filter === 'LOAN_COMPLETED') return item.loanStatus === 'Loan Completed';
        if (filter === 'NO_LOAN') return item.loanStatus === 'No Loan';
        if (filter === 'LOAN_TAKEN') return item.loanStatus === 'Loan Active' || item.loanStatus === 'Loan Completed';

        return true;
      });
    })
  );

  getLoanBadgeClass(status: string): string {
    switch (status) {
      case 'Loan Active': return 'badge-active';
      case 'Loan Completed': return 'badge-completed';
      default: return 'badge-none';
    }
  }

  getPaginatedUsers(users: UserSummary[]): UserSummary[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return users.slice(start, start + this.pageSize());
  }

  getTotalPages(count: number): number {
    return Math.ceil(count / this.pageSize()) || 1;
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedFilter.set('ALL');
    this.currentPage.set(1);
  }

  // --- Add Amount Modal ---
  openAddAmountModal(user: User): void {
    this.selectedUser.set(user);
    this.addAmountForm.reset({
      amount: depositFor(user),
      description: 'Monthly savings contribution',
      date: new Date().toISOString().split('T')[0],
      lateFee: false
    });
    this.isAddAmountModalOpen.set(true);
  }

  closeAddAmountModal(): void {
    this.isAddAmountModalOpen.set(false);
    this.selectedUser.set(null);
  }

  setAmount(amt: number): void {
    this.addAmountForm.patchValue({ amount: amt });
  }

  async submitAddAmount(): Promise<void> {
    if (this.addAmountForm.invalid || !this.selectedUser()) return;

    this.isSubmitting.set(true);
    const val = this.addAmountForm.value;
    const user = this.selectedUser()!;

    try {
      const res = await this.userService.addAmount(
        user.userId,
        Number(val.amount),
        val.description,
        val.date,
        !!val.lateFee
      );

      this.isSubmitting.set(false);
      this.closeAddAmountModal();

      if (res.success) {
        this.toast.success(res.message, 'Amount Credited');
      } else {
        this.toast.error(res.message, 'Operation Failed');
      }
    } catch (err: any) {
      this.isSubmitting.set(false);
      this.toast.error(err.message || 'Operation failed', 'Error');
    }
  }

  // --- Add User Modal ---
  openAddUserModal(): void {
    this.nextAssignedId.set(this.userService.generateNextUserId());
    this.registerUserForm.reset({
      name: '',
      mobile: '',
      email: '',
      password: 'user@123',
      occupation: 'Member',
      address: 'Jaipur, Rajasthan',
      shares: 1
    });
    this.isAddUserModalOpen.set(true);
  }

  closeAddUserModal(): void {
    this.isAddUserModalOpen.set(false);
  }

  // --- Bulk Add ---
  bulkOpen = signal<boolean>(false);
  bulkProgress = signal<string>('');

  async bulkAdd(text: string): Promise<void> {
    const rows = text.split('\n').map(l => l.split(',').map(s => s.trim())).filter(r => r[0] && r[1]);
    if (!rows.length || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const failed: string[] = [];
    // Sequential: each registration takes the next SOCITY id from the counter transaction
    for (const [i, [name, email, shares]] of rows.entries()) {
      this.bulkProgress.set(`Adding ${i + 1}/${rows.length}...`);
      const res = await this.userService.registerUser({ name, email, mobile: '', password: '123456', shares: Number(shares) || 1 }, true);
      if (!res.success) failed.push(`${name}: ${res.message}`);
    }
    this.isSubmitting.set(false);
    if (failed.length) {
      console.warn('Bulk add failures:\n' + failed.join('\n'));
      this.toast.error(`${failed.length} failed (see console): ${failed.slice(0, 3).join('; ')}`, 'Bulk Add');
    }
    this.toast.success(`${rows.length - failed.length} of ${rows.length} members added.`, 'Bulk Add');
  }

  async submitRegisterUser(): Promise<void> {
    if (this.registerUserForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const val = this.registerUserForm.value;

    try {
      const res = await this.userService.registerUser(val, true);
      if (res.success) {
        this.toast.success(`Registered new member ${res.user?.name} (${res.user?.userId})!`, 'Member Registered');
        this.closeAddUserModal();
      } else {
        this.toast.error(res.message, 'Registration Failed');
      }
    } catch (err: any) {
      this.toast.error(err.message || 'Registration failed', 'Error');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
