import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService, ConfirmDialogData } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="(dialogData$ | async) as data" (click)="onCancel()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="icon-bubble" [ngClass]="'bubble-' + (data.type || 'primary')">
            <svg *ngIf="data.type === 'danger'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <svg *ngIf="data.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <svg *ngIf="data.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <svg *ngIf="!data.type || data.type === 'primary'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <h3 class="modal-title">{{ data.title }}</h3>
        </div>

        <div class="modal-body">
          <p class="modal-message">{{ data.message }}</p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            {{ data.cancelText || 'Cancel' }}
          </button>
          <button
            type="button"
            class="btn"
            [ngClass]="getButtonClass(data.type)"
            (click)="onConfirm()"
          >
            {{ data.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid #E2E8F0;
    }
    @keyframes scaleUp {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-header {
      padding: 24px 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }
    .icon-bubble {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bubble-primary { background: #EEF2FF; color: #3155C8; }
    .bubble-danger { background: #FEE2E2; color: #DC2626; }
    .bubble-warning { background: #FEF3C7; color: #D97706; }
    .bubble-success { background: #DCFCE7; color: #16A34A; }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #172033;
      margin: 0;
    }
    .modal-body {
      padding: 0 24px 24px;
      text-align: center;
    }
    .modal-message {
      color: #64748B;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0;
      white-space: pre-line;
    }
    .modal-actions {
      padding: 16px 24px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: #F8FAFC;
      border-top: 1px solid #F1F5F9;
    }
    .btn {
      padding: 10px 18px;
      font-size: 0.92rem;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      flex: 1;
    }
    .btn-secondary {
      background: #E2E8F0;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #CBD5E1;
    }
    .btn-primary {
      background: #3155C8;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #2643A3;
    }
    .btn-danger {
      background: #DC2626;
      color: #ffffff;
    }
    .btn-danger:hover {
      background: #B91C1C;
    }
    .btn-success {
      background: #16A34A;
      color: #ffffff;
    }
    .btn-success:hover {
      background: #15803D;
    }
    .btn-warning {
      background: #F59E0B;
      color: #ffffff;
    }
    .btn-warning:hover {
      background: #D97706;
    }
  `]
})
export class ConfirmModalComponent {
  private dialogService = inject(ConfirmDialogService);
  dialogData$ = this.dialogService.dialogState;

  onConfirm(): void {
    this.dialogService.handleAnswer(true);
  }

  onCancel(): void {
    this.dialogService.handleAnswer(false);
  }

  getButtonClass(type?: string): string {
    switch (type) {
      case 'danger': return 'btn-danger';
      case 'warning': return 'btn-warning';
      case 'success': return 'btn-success';
      default: return 'btn-primary';
    }
  }
}
