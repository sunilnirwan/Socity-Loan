import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../core/services/transaction.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { Transaction } from '../../core/models/transaction.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Society Transactions & Ledger</h1>
          <p class="page-subtitle">Comprehensive financial audit log of contributions, disbursements, and EMI collections</p>
        </div>
      </div>

      <!-- Monthly Installments: click a cell, type amount, Enter to credit -->
      <div class="content-card">
        <div class="kist-head">
          <h3 class="kist-title">Monthly Installments</h3>
          <input
            #searchBox
            type="search"
            class="kist-search"
            placeholder="Search member name or ID..."
            (input)="search.set(searchBox.value)"
          />
          <div class="year-nav">
            <button class="filter-pill" (click)="year.set(year() - 1)">‹</button>
            <b>{{ year() }}</b>
            <button class="filter-pill" (click)="year.set(year() + 1)">›</button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th *ngFor="let mo of months" class="text-right">{{ mo }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of visibleRows()">
                <td>
                  <div class="member-cell">
                    <span class="m-name">{{ row.user.name }}</span>
                    <span class="m-id">{{ row.user.userId }}</span>
                  </div>
                </td>
                <td *ngFor="let cell of row.months; let m = index" class="text-right kist-cell" (click)="editing.set(row.user.userId + '|' + m)">
                  <input
                    *ngIf="editing() === row.user.userId + '|' + m; else showAmt"
                    #kistInput
                    type="number"
                    min="0"
                    class="kist-input"
                    placeholder="Amount"
                    [value]="cell.total || ''"
                    (blur)="saveKist(row.user.userId, m, cell, kistInput.value)"
                    (keydown.enter)="kistInput.blur()"
                    (keydown.escape)="kistInput.value = ''; kistInput.blur()"
                  />
                  <ng-template #showAmt>
                    <span [ngClass]="cell.total ? 'text-success font-bold' : 'kist-empty'">{{ cell.total ? (cell.total | inrCurrency) : '—' }}</span>
                  </ng-template>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="kist-total">
                <td>Total</td>
                <td *ngFor="let total of monthTotals()" class="text-right">{{ total ? (total | inrCurrency) : '—' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Toolbar -->
      

      <!-- Table View -->
     
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

    .kist-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 14px 16px; }
    .kist-title { margin: 0; font-size: 1rem; font-weight: 800; color: #172033; }
    .kist-search { flex: 1; max-width: 320px; height: 36px; padding: 4px 12px; border-radius: 8px; border: 1.5px solid #CBD5E1; font-size: 0.85rem; outline: none; }
    .kist-search:focus { border-color: #3155C8; }
    .year-nav { display: flex; align-items: center; gap: 8px; }
    .kist-cell { cursor: pointer; white-space: nowrap; }
    .kist-cell:hover { background: #EEF2FF; }
    .kist-empty { color: #CBD5E1; }
    .kist-total td { background: #F8FAFC; font-weight: 800; color: #172033; border-top: 2px solid #E2E8F0; white-space: nowrap; }
    .kist-input { width: 90px; height: 32px; padding: 4px 8px; border: 1.5px solid #3155C8; border-radius: 6px; text-align: right; outline: none; }

    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-danger { background: #FEE2E2; color: #DC2626; }
  `]
})
export class AdminTransactionsComponent {
  private txnService = inject(TransactionService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  year = signal(new Date().getFullYear());
  editing = signal<string | null>(null); // "userId|monthIndex"

  @ViewChild('kistInput') set focusKistInput(el: ElementRef<HTMLInputElement> | undefined) {
    el?.nativeElement.focus();
    el?.nativeElement.select();
  }

  private allTxns = toSignal(this.txnService.getTransactions$(), { initialValue: [] });
  private users = toSignal(this.userService.getUsers$(), { initialValue: [] });

  // Credit transactions per member per month for the selected year
  kistGrid = computed(() => {
    const y = String(this.year());
    const byCell = new Map<string, Transaction[]>();
    for (const t of this.allTxns()) {
      if (t.type !== 'credit' || !t.date?.startsWith(y)) continue;
      const key = `${t.userId}|${Number(t.date.slice(5, 7)) - 1}`;
      byCell.set(key, [...(byCell.get(key) || []), t]);
    }
    return this.users()
      .filter(u => u.role !== 'admin')
      .map(u => ({
        user: u,
        months: this.months.map((_, m) => {
          const txns = byCell.get(`${u.userId}|${m}`) || [];
          return { total: txns.reduce((s, t) => s + t.amount, 0), txns };
        })
      }));
  });

  search = signal('');

  visibleRows = computed(() => {
    const q = this.search().toLowerCase().trim();
    return q
      ? this.kistGrid().filter(r => r.user.name?.toLowerCase().includes(q) || r.user.userId.toLowerCase().includes(q))
      : this.kistGrid();
  });

  monthTotals = computed(() =>
    this.months.map((_, m) => this.visibleRows().reduce((sum, row) => sum + row.months[m].total, 0))
  );

  // Typed value becomes the month's total: adds a new entry if the month is empty, otherwise edits the latest entry
  async saveKist(userId: string, m: number, cell: { total: number; txns: Transaction[] }, value: string): Promise<void> {
    this.editing.set(null);
    if (value.trim() === '') return;
    const target = Number(value);
    if (!(target >= 0) || target === cell.total) return;

    const y = this.year();
    if (cell.txns.length === 0) {
      if (target === 0) return;
      const now = new Date();
      const date = now.getFullYear() === y && now.getMonth() === m
        ? now.toISOString().split('T')[0]
        : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const res = await this.userService.addAmount(userId, target, `Monthly installment - ${this.months[m]} ${y}`, date);
      if (!res.success) this.toast.error(res.message, 'Failed');
      return;
    }

    // allTxns is sorted by date desc, so txns[0] is the latest entry of the month
    const latest = cell.txns[0];
    const newAmount = latest.amount + (target - cell.total);
    if (newAmount < 0) {
      this.toast.error(`This month has ${cell.txns.length} entries; edit them from the ledger to go below ${cell.total - latest.amount}.`, 'Failed');
      return;
    }
    const res = await this.userService.editCreditAmount(latest, newAmount);
    if (!res.success) this.toast.error(res.message, 'Failed');
  }
}
