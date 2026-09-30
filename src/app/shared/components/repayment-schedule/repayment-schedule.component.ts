import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loan, RepaymentInstallment } from '../../../core/models/loan.model';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';

@Component({
  selector: 'app-repayment-schedule',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe],
  template: `
    <div class="schedule-wrapper" *ngIf="loan">
      <!-- Summary Bar -->
      <div class="loan-summary-bar">
        <div class="summary-item">
          <span class="label">Total Loan Amount</span>
          <span class="val highlight">{{ loan.loanAmount | inrCurrency }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Monthly EMI ({{ loan.totalMonths }} Mo)</span>
          <span class="val">{{ loan.monthlyEMI | inrCurrency }}/mo</span>
        </div>
        <div class="summary-item">
          <span class="label">Paid Progress</span>
          <span class="val text-success">{{ loan.paidMonths }}/{{ loan.totalMonths }} Paid ({{ loan.paidAmount | inrCurrency }})</span>
        </div>
        <div class="summary-item">
          <span class="label">Remaining Balance</span>
          <span class="val text-danger">{{ loan.pendingAmount | inrCurrency }}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-container">
        <div class="progress-bar-bg">
          <div
            class="progress-bar-fill"
            [style.width.%]="(loan.paidMonths / loan.totalMonths) * 100"
            [class.completed]="loan.paidMonths === loan.totalMonths"
          ></div>
        </div>
        <div class="progress-labels">
          <span>Started: {{ loan.loanDate }}</span>
          <span><b>{{ ((loan.paidMonths / loan.totalMonths) * 100).toFixed(0) }}%</b> Completed</span>
          <span>Fixed Term: {{ loan.totalMonths }} Months</span>
        </div>
      </div>

      <!-- Schedule Grid / Table -->
      <div class="table-responsive">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Installment (EMI)</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Payment Info</th>
              <th>Status</th>
              <th *ngIf="showPayAction" class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let inst of loan.repaymentSchedule; let i = index"
              [class.row-paid]="inst.status === 'Paid'"
              [class.row-next]="isNextPayable(inst)"
            >
              <td>
                <div class="month-pill" [class.paid-pill]="inst.status === 'Paid'" [class.next-pill]="isNextPayable(inst)">
                  <span class="month-num">#{{ inst.installmentNumber }}</span>
                  <span class="month-text">Month {{ inst.installmentNumber }}</span>
                </div>
              </td>
              <td>
                <span class="emi-amount">{{ inst.amount | inrCurrency }}</span>
              </td>
              <td>
                <span class="due-date">{{ inst.dueDate | date:'dd/MM/yyyy' }}</span>
              </td>
              <td>
                <span *ngIf="inst.paidDate" class="paid-date">{{ inst.paidDate }}</span>
                <span *ngIf="!inst.paidDate" class="text-muted">-</span>
              </td>
              <td>
                <div *ngIf="inst.paymentMethod" class="payment-ref">
                  <span class="method-badge">{{ inst.paymentMethod }}</span>
                  <span class="ref-code" *ngIf="inst.transactionRef">{{ inst.transactionRef }}</span>
                </div>
                <span *ngIf="!inst.paymentMethod" class="text-muted">-</span>
              </td>
              <td>
                <span class="badge" [ngClass]="inst.status === 'Paid' ? 'badge-success' : (isNextPayable(inst) ? 'badge-warning' : 'badge-pending')">
                  {{ inst.status === 'Paid' ? 'Paid' : (isNextPayable(inst) ? 'Due Next' : 'Pending') }}
                </span>
              </td>
              <td *ngIf="showPayAction" class="text-right">
                <button
                  *ngIf="isNextPayable(inst)"
                  class="btn btn-sm btn-pay-now"
                  (click)="payInstallment.emit(inst)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  Pay Now
                </button>
                <span *ngIf="inst.status === 'Paid'" class="text-success-check">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Done
                </span>
                <span *ngIf="inst.status === 'Pending' && !isNextPayable(inst)" class="text-muted text-small">
                  Locked
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .schedule-wrapper {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .loan-summary-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      padding: 16px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .summary-item .label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.04em;
    }
    .summary-item .val {
      font-size: 1.05rem;
      font-weight: 700;
      color: #1E293B;
    }
    .summary-item .highlight {
      color: #3155C8;
    }
    .text-success { color: #16A34A !important; }
    .text-danger { color: #DC2626 !important; }

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .progress-bar-bg {
      height: 10px;
      background: #E2E8F0;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: #3155C8;
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .progress-bar-fill.completed {
      background: #16A34A;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: #64748B;
    }

    .table-responsive {
      overflow-x: auto;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: #ffffff;
    }
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .schedule-table th {
      background: #F8FAFC;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #E2E8F0;
      white-space: nowrap;
    }
    .schedule-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
      vertical-align: middle;
    }
    .schedule-table tr:last-child td {
      border-bottom: none;
    }
    .row-paid {
      background: #F0FDF4;
    }
    .row-next {
      background: #EFF6FF;
      border-left: 3px solid #3155C8;
    }

    .month-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #F1F5F9;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.82rem;
    }
    .paid-pill {
      background: #DCFCE7;
      color: #15803D;
    }
    .next-pill {
      background: #DBEAFE;
      color: #1D4ED8;
    }

    .emi-amount {
      font-weight: 700;
      color: #0F172A;
    }
    .due-date {
      color: #475569;
      font-size: 0.84rem;
    }
    .paid-date {
      color: #15803D;
      font-weight: 600;
      font-size: 0.84rem;
    }
    .payment-ref {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .method-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 4px;
      width: fit-content;
      color: #334155;
    }
    .ref-code {
      font-size: 0.72rem;
      color: #64748B;
      font-family: monospace;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-success {
      background: #DCFCE7;
      color: #15803D;
    }
    .badge-warning {
      background: #FEF3C7;
      color: #B45309;
    }
    .badge-pending {
      background: #F1F5F9;
      color: #64748B;
    }

    .btn-pay-now {
      background: #3155C8;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      box-shadow: 0 2px 6px rgba(49, 85, 200, 0.25);
    }
    .btn-pay-now:hover {
      background: #2643A3;
      transform: translateY(-1px);
    }
    .text-success-check {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #16A34A;
      font-weight: 600;
      font-size: 0.82rem;
    }
    .text-small {
      font-size: 0.78rem;
    }
    .text-right {
      text-align: right;
    }
  `]
})
export class RepaymentScheduleComponent {
  @Input() loan?: Loan;
  @Input() showPayAction: boolean = false;
  @Output() payInstallment = new EventEmitter<RepaymentInstallment>();

  isNextPayable(inst: RepaymentInstallment): boolean {
    if (!this.loan || (this.loan.status || '').toLowerCase() === 'completed') return false;
    const schedule = this.loan.repaymentSchedule || [];
    const nextPending = schedule.find(i => (i.status || '').toLowerCase() === 'pending');
    const targetNo = inst.installmentNumber || inst.installmentNo;
    const nextNo = nextPending?.installmentNumber || nextPending?.installmentNo;
    return nextNo === targetNo;
  }
}
