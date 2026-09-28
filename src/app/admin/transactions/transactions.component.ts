import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InrCurrencyPipe, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Society Transactions & Ledger</h1>
          <p class="page-subtitle">Comprehensive financial audit log of contributions, disbursements, and EMI collections</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-card">
        <div class="search-box">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search by Txn ID, User ID, Member Name, or Description..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
          <button *ngIf="searchQuery()" class="btn-clear" (click)="searchQuery.set('')">✕</button>
        </div>

        <div class="filter-row">
          <!-- Type Filter -->
          <div class="filter-pills">
            <button
              class="filter-pill"
              [class.active]="selectedType() === 'ALL'"
              (click)="selectedType.set('ALL')"
            >
              All Types
            </button>
            <button
              class="filter-pill"
              [class.active]="selectedType() === 'credit'"
              (click)="selectedType.set('credit')"
            >
              Credits (+)
            </button>
            <button
              class="filter-pill"
              [class.active]="selectedType() === 'debit'"
              (click)="selectedType.set('debit')"
            >
              Debits (-)
            </button>
          </div>

          <!-- Category Filter -->
          <div class="category-select-wrap">
            <label class="cat-label">Category:</label>
            <select
              class="cat-select"
              [ngModel]="selectedCategory()"
              (ngModelChange)="selectedCategory.set($event)"
            >
              <option value="ALL">All Categories</option>
              <option value="contribution">Member Contribution</option>
              <option value="loan_disbursement">Loan Disbursement</option>
              <option value="emi_payment">EMI Payment</option>
              <option value="admin_topup">Admin Top-up</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div class="content-card" *ngIf="filteredTxns$ | async as txns">
        <div class="table-responsive" *ngIf="txns.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Date</th>
                <th>Member</th>
                <th>Category</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Type</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of txns">
                <td><span class="code-badge">{{ t.transactionId }}</span></td>
                <td><span class="date-cell">{{ t.date }}</span></td>
                <td>
                  <div class="member-cell">
                    <span class="m-name">{{ t.userName }}</span>
                    <span class="m-id">{{ t.userId }}</span>
                  </div>
                </td>
                <td><span class="cat-pill">{{ t.category }}</span></td>
                <td><span class="desc-text">{{ t.description }}</span></td>
                <td><span class="ref-badge">{{ t.referenceId || '-' }}</span></td>
                <td>
                  <span class="badge" [ngClass]="t.type === 'credit' ? 'badge-success' : 'badge-danger'">
                    {{ t.type }}
                  </span>
                </td>
                <td class="text-right font-bold" [ngClass]="t.type === 'credit' ? 'text-success' : 'text-danger'">
                  {{ t.type === 'credit' ? '+' : '-' }}{{ t.amount | inrCurrency }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="txns.length === 0"
          title="No transactions found"
          description="No ledger records matched your current query or category filter."
          actionText="Reset Filters"
          (action)="resetFilters()"
        ></app-empty-state>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #172033; margin: 0; }
    .page-subtitle { font-size: 0.88rem; color: #64748B; margin: 4px 0 0; }

    .toolbar-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .search-box { position: relative; display: flex; align-items: center; width: 100%; }
    .search-icon { position: absolute; left: 14px; color: #94A3B8; pointer-events: none; }
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
    }
    .search-input:focus { border-color: #3155C8; background: #ffffff; }
    .btn-clear { position: absolute; right: 12px; background: none; border: none; color: #94A3B8; cursor: pointer; }

    .filter-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .filter-pills { display: flex; gap: 8px; }
    .filter-pill {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
    }
    .filter-pill.active { background: #3155C8; color: #ffffff; border-color: #3155C8; }

    .category-select-wrap { display: flex; align-items: center; gap: 8px; }
    .cat-label { font-size: 0.82rem; font-weight: 600; color: #64748B; }
    .cat-select {
      height: 36px;
      padding: 4px 12px;
      border-radius: 8px;
      border: 1.5px solid #CBD5E1;
      font-size: 0.85rem;
      color: #172033;
      background: #ffffff;
      outline: none;
    }

    .content-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .data-table th { background: #F8FAFC; padding: 14px 16px; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #E2E8F0; white-space: nowrap; }
    .data-table td { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
    .data-table tr:hover { background: #FAFCFF; }

    .code-badge { font-family: monospace; font-size: 0.82rem; font-weight: 700; color: #334155; }
    .date-cell { font-size: 0.82rem; color: #64748B; white-space: nowrap; }
    .member-cell { display: flex; flex-direction: column; }
    .m-name { font-weight: 700; }
    .m-id { font-size: 0.74rem; color: #64748B; font-family: monospace; }
    .cat-pill { font-size: 0.74rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: #475569; text-transform: capitalize; }
    .desc-text { font-size: 0.86rem; color: #334155; }
    .ref-badge { font-family: monospace; font-size: 0.76rem; color: #64748B; background: #F8FAFC; padding: 2px 6px; border-radius: 4px; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16A34A !important; }
    .text-danger { color: #DC2626 !important; }
    .text-right { text-align: right; }

    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-danger { background: #FEE2E2; color: #DC2626; }
  `]
})
export class AdminTransactionsComponent {
  private txnService = inject(TransactionService);

  searchQuery = signal<string>('');
  selectedType = signal<'ALL' | 'credit' | 'debit'>('ALL');
  selectedCategory = signal<string>('ALL');

  filteredTxns$: Observable<Transaction[]> = this.txnService.getTransactions$().pipe(
    map(txns => {
      const q = this.searchQuery().toLowerCase().trim();
      const type = this.selectedType();
      const cat = this.selectedCategory();

      return txns.filter(t => {
        const matchesQ = !q ||
          t.transactionId.toLowerCase().includes(q) ||
          t.userId.toLowerCase().includes(q) ||
          (t.userName && t.userName.toLowerCase().includes(q)) ||
          t.description.toLowerCase().includes(q) ||
          (t.referenceId && t.referenceId.toLowerCase().includes(q));

        if (!matchesQ) return false;

        if (type !== 'ALL' && t.type !== type) return false;
        if (cat !== 'ALL' && t.category !== cat) return false;

        return true;
      });
    })
  );

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('ALL');
    this.selectedCategory.set('ALL');
  }
}
