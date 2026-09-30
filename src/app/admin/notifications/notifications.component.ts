import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { PaymentService } from '../../core/services/payment.service';
import { LoanService } from '../../core/services/loan.service';
import { ToastService } from '../../core/services/toast.service';
import { AppNotification } from '../../core/models/notification.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, InrCurrencyPipe, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Admin Notifications & Alerts</h1>
          <p class="page-subtitle">Real-time alerts on loan applications, installment collections, and completions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="markAllAsRead()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="toolbar-card">
        <div class="filter-pills">
          <button
            class="filter-pill"
            [class.active]="selectedTab() === 'ALL'"
            (click)="selectedTab.set('ALL')"
          >
            All Notifications
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedTab() === 'UNREAD'"
            (click)="selectedTab.set('UNREAD')"
          >
            Unread Only
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedTab() === 'LOAN_EVENTS'"
            (click)="selectedTab.set('LOAN_EVENTS')"
          >
            Loan Events
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedTab() === 'PAYMENT_EVENTS'"
            (click)="selectedTab.set('PAYMENT_EVENTS')"
          >
            Payments
          </button>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="content-card" *ngIf="filteredNotifications$ | async as notifs">
        <div class="notif-list" *ngIf="notifs.length > 0">
          <div
            *ngFor="let n of notifs"
            class="notif-card"
            [class.unread]="!n.isRead"
            (click)="onNotificationClick(n)"
          >
            <!-- Icon -->
            <div class="notif-icon-circle" [ngClass]="'circle-' + n.type">
              <svg *ngIf="n.type === 'taken_loan'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="m8 12 4 4 4-4"/></svg>
              <svg *ngIf="n.type === 'installment_paid'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <svg *ngIf="n.type === 'loan_completed'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              <svg *ngIf="n.type === 'admin_credit' || n.type === 'system'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>

            <!-- Content -->
            <div class="notif-content">
              <div class="notif-top">
                <span class="notif-title">{{ n.title }}</span>
                <span class="notif-date">{{ n.createdAt }}</span>
              </div>
              <p class="notif-msg">{{ n.message }}</p>
              <div class="notif-tags">
                <span class="tag-user" *ngIf="n.userId">User: {{ n.userId }}</span>
                <span class="tag-loan" *ngIf="n.loanId">Loan: {{ n.loanId }}</span>
                <span class="tag-amount" *ngIf="n.amount">Amount: {{ n.amount | inrCurrency }}</span>
              </div>
            </div>

            <!-- Approve / reject a member's payment request -->
            <div class="approval-box" *ngIf="n.type === 'payment_request' && n.paymentDocId" (click)="$event.stopPropagation()">
              <ng-container *ngIf="paymentStatus(n) === 'Pending'; else doneTpl">
                <button class="btn-approve" [disabled]="processingId() === n.paymentDocId" (click)="approve(n)">
                  {{ processingId() === n.paymentDocId ? 'Processing...' : 'Approve' }}
                </button>
                <button class="btn-reject" [disabled]="processingId() === n.paymentDocId" (click)="reject(n)">Reject</button>
              </ng-container>
              <ng-template #doneTpl>
                <span class="status-chip" [class.rejected]="paymentStatus(n) === 'Rejected'">{{ paymentStatus(n) === 'Rejected' ? 'Rejected' : 'Approved' }}</span>
              </ng-template>
            </div>

            <!-- Approve / reject a member's loan application -->
            <div class="approval-box" *ngIf="n.type === 'loan_request' && n.loanId" (click)="$event.stopPropagation()">
              <ng-container *ngIf="loanStatus(n) === 'Pending'; else loanDoneTpl">
                <button class="btn-approve" [disabled]="processingId() === n.loanId" (click)="approveLoan(n)">
                  {{ processingId() === n.loanId ? 'Processing...' : 'Approve' }}
                </button>
                <button class="btn-reject" [disabled]="processingId() === n.loanId" (click)="rejectLoan(n)">Reject</button>
              </ng-container>
              <ng-template #loanDoneTpl>
                <span class="status-chip" [class.rejected]="loanStatus(n) === 'Rejected'">{{ loanStatus(n) === 'Rejected' ? 'Rejected' : 'Approved' }}</span>
              </ng-template>
            </div>

            <!-- Action indicators -->
            <div class="notif-actions">
              <span class="unread-dot" *ngIf="!n.isRead" title="Unread"></span>
              <button class="btn-delete" (click)="deleteNotif(n, $event)" title="Delete Notification">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>

        <app-empty-state
          *ngIf="notifs.length === 0"
          title="No notifications"
          description="You're all caught up! New alerts will appear here when members take loans or make payments."
        ></app-empty-state>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #172033; margin: 0; }
    .page-subtitle { font-size: 0.88rem; color: #64748B; margin: 4px 0 0; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; font-size: 0.88rem; font-weight: 600; border-radius: 10px; cursor: pointer; border: 1px solid #CBD5E1; background: #ffffff; color: #334155; }
    .btn:hover { background: #F8FAFC; }

    .toolbar-card { background: #ffffff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 14px 20px; }
    .filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-pill { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; color: #475569; cursor: pointer; }
    .filter-pill.active { background: #3155C8; color: #ffffff; border-color: #3155C8; }

    .content-card { background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); overflow: hidden; }

    .notif-list { display: flex; flex-direction: column; }
    .notif-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 18px 24px;
      border-bottom: 1px solid #F1F5F9;
      cursor: pointer;
      transition: background 0.15s;
    }
    .notif-card:hover { background: #F8FAFC; }
    .notif-card.unread { background: #EFF6FF; }

    .notif-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .circle-taken_loan { background: #DCFCE7; color: #16A34A; }
    .circle-installment_paid { background: #DBEAFE; color: #2563EB; }
    .circle-loan_completed { background: #FEF3C7; color: #D97706; }
    .circle-admin_credit, .circle-system { background: #F3E8FF; color: #9333EA; }

    .notif-content { flex: 1; }
    .notif-top { display: flex; justify-content: space-between; align-items: center; }
    .notif-title { font-size: 0.95rem; font-weight: 700; color: #172033; }
    .notif-date { font-size: 0.76rem; color: #94A3B8; }
    .notif-msg { font-size: 0.86rem; color: #475569; margin: 4px 0 8px; line-height: 1.4; }

    .notif-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .tag-user, .tag-loan, .tag-amount {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      background: #F1F5F9;
      color: #334155;
      font-family: monospace;
    }
    .tag-amount { background: #DCFCE7; color: #15803D; }

    .notif-actions { display: flex; align-items: center; gap: 12px; margin-left: 8px; }
    .unread-dot { width: 10px; height: 10px; border-radius: 50%; background: #3155C8; }
    .btn-delete { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px; border-radius: 6px; }
    .btn-delete:hover { color: #DC2626; background: #FEE2E2; }
    .approval-box { display: flex; align-items: center; gap: 8px; margin-left: 8px; }
    .btn-approve, .btn-reject { padding: 7px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: 1px solid transparent; }
    .btn-approve { background: #16A34A; color: #fff; }
    .btn-reject { background: #fff; color: #DC2626; border-color: #FCA5A5; }
    .btn-approve:disabled, .btn-reject:disabled { opacity: 0.6; cursor: not-allowed; }
    .status-chip { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: #DCFCE7; color: #15803D; }
    .status-chip.rejected { background: #FEE2E2; color: #DC2626; }
  `]
})
export class AdminNotificationsComponent {
  private notifService = inject(NotificationService);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  processingId = signal<string | null>(null);
  private allPayments = toSignal(this.paymentService.getAllPayments$(), { initialValue: [] });

  paymentStatus(n: AppNotification): string {
    return this.allPayments().find(p => p.id === n.paymentDocId)?.status || 'Pending';
  }

  async approve(n: AppNotification): Promise<void> {
    this.processingId.set(n.paymentDocId!);
    const res = await this.paymentService.approvePayment(n.paymentDocId!);
    this.processingId.set(null);
    res.success ? this.toast.success(res.message, 'Payment Approved') : this.toast.error(res.message, 'Approval Failed');
    if (res.success && n.id) this.notifService.markAsRead(n.id);
  }

  private loanService = inject(LoanService);
  private allLoans = toSignal(this.loanService.getAllLoans$(), { initialValue: [] });

  loanStatus(n: AppNotification): string {
    return this.allLoans().find(l => l.loanId === n.loanId)?.status || 'Pending';
  }

  async approveLoan(n: AppNotification): Promise<void> {
    this.processingId.set(n.loanId!);
    const res = await this.loanService.approveLoan(n.loanId!);
    this.processingId.set(null);
    res.success ? this.toast.success(res.message, 'Loan Approved') : this.toast.error(res.message, 'Approval Failed');
    if (res.success && n.id) this.notifService.markAsRead(n.id);
  }

  async rejectLoan(n: AppNotification): Promise<void> {
    this.processingId.set(n.loanId!);
    const res = await this.loanService.rejectLoan(n.loanId!);
    this.processingId.set(null);
    res.success ? this.toast.info(res.message, 'Loan Rejected') : this.toast.error(res.message, 'Reject Failed');
    if (res.success && n.id) this.notifService.markAsRead(n.id);
  }

  async reject(n: AppNotification): Promise<void> {
    this.processingId.set(n.paymentDocId!);
    const res = await this.paymentService.rejectPayment(n.paymentDocId!);
    this.processingId.set(null);
    res.success ? this.toast.info(res.message, 'Payment Rejected') : this.toast.error(res.message, 'Reject Failed');
    if (res.success && n.id) this.notifService.markAsRead(n.id);
  }

  selectedTab = signal<'ALL' | 'UNREAD' | 'LOAN_EVENTS' | 'PAYMENT_EVENTS'>('ALL');

  filteredNotifications$: Observable<AppNotification[]> = this.notifService.getNotifications$().pipe(
    map(notifs => {
      const tab = this.selectedTab();
      if (tab === 'UNREAD') return notifs.filter(n => !n.isRead);
      if (tab === 'LOAN_EVENTS') return notifs.filter(n => n.type === 'taken_loan' || n.type === 'loan_completed' || n.type === 'loan_request');
      if (tab === 'PAYMENT_EVENTS') return notifs.filter(n => n.type === 'installment_paid' || n.type === 'payment_request');
      return notifs;
    })
  );

  markAllAsRead(): void {
    this.notifService.markAllAsRead();
  }

  onNotificationClick(n: AppNotification): void {
    if (n.id) {
      this.notifService.markAsRead(n.id);
    }
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  deleteNotif(n: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    if (n.id) {
      this.notifService.deleteNotification(n.id);
    }
  }
}
