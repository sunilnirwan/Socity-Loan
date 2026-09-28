import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-user-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InrCurrencyPipe, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">My Transaction Ledger</h1>
          <p class="page-subtitle">Your personal record of deposits, loan disbursements, and EMI deductions</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-card">
        <div class="filter-pills">
          <button
            class="filter-pill"
            [class.active]="selectedType() === 'ALL'"
            (click)="selectedType.set('ALL')"
          >
            All Ledger ({{ totalCount() }})
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedType() === 'credit'"
            (click)="selectedType.set('credit')"
          >
            Credits / Inflow (+)
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedType() === 'debit'"
            (click)="selectedType.set('debit')"
          >
            Debits / EMIs (-)
          </button>
        </div>
      </div>

      <!-- Content Table -->
      <div class="content-card" *ngIf="filteredTxns$ | async as txns">
        <div class="table-responsive" *ngIf="txns.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Date</th>
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
          description="Your personal account transaction history will show up here."
        ></app-empty-state>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #172033; margin: 0; }
    .page-subtitle { font-size: 0.88rem; color: #64748B; margin: 4px 0 0; }

    .toolbar-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 14px 20px;
    }
    .filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }
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

    .content-card {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .data-table th { background: #F8FAFC; padding: 12px 14px; text-align: left; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; }
    .data-table td { padding: 14px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
    .data-table tr:hover { background: #FAFCFF; }

    .code-badge { font-family: monospace; font-size: 0.82rem; font-weight: 700; color: #334155; }
    .date-cell { font-size: 0.82rem; color: #64748B; }
    .cat-pill { font-size: 0.74rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-weight: 600; text-transform: capitalize; }
    .desc-text { font-size: 0.86rem; color: #334155; }
    .ref-badge { font-family: monospace; font-size: 0.76rem; color: #64748B; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16A34A !important; }
    .text-danger { color: #DC2626 !important; }
    .text-right { text-align: right; }

    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-danger { background: #FEE2E2; color: #DC2626; }
  `]
})
export class UserTransactionsComponent {
  private authService = inject(AuthService);
  private txnService = inject(TransactionService);

  currentUser = this.authService.getCurrentUser();
  selectedType = signal<'ALL' | 'credit' | 'debit'>('ALL');
  totalCount = signal<number>(0);

  filteredTxns$: Observable<Transaction[]> = this.txnService.getUserTransactions$(this.currentUser?.userId || '').pipe(
    map(txns => {
      this.totalCount.set(txns.length);
      const type = this.selectedType();
      if (type === 'ALL') return txns;
      return txns.filter(t => t.type === type);
    })
  );
}
