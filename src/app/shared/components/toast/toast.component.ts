import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="(toasts$ | async) as toasts">
      <div
        *ngFor="let toast of toasts"
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
        role="alert"
      >
        <div class="toast-icon">
          <!-- Success -->
          <svg *ngIf="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <!-- Error -->
          <svg *ngIf="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          <!-- Warning -->
          <svg *ngIf="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <!-- Info -->
          <svg *ngIf="toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="close(toast.id)" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      width: calc(100vw - 48px);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 8px rgba(15, 23, 42, 0.08);
      border-left: 5px solid #3155C8;
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.2s ease;
    }
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
    .toast-success {
      border-left-color: #16A34A;
      background: #F0FDF4;
    }
    .toast-success .toast-icon {
      color: #16A34A;
    }
    .toast-error {
      border-left-color: #DC2626;
      background: #FEF2F2;
    }
    .toast-error .toast-icon {
      color: #DC2626;
    }
    .toast-warning {
      border-left-color: #F59E0B;
      background: #FFFBEB;
    }
    .toast-warning .toast-icon {
      color: #D97706;
    }
    .toast-info {
      border-left-color: #3155C8;
      background: #EEF2FF;
    }
    .toast-info .toast-icon {
      color: #3155C8;
    }
    .toast-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .toast-content {
      flex: 1;
    }
    .toast-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: #172033;
      margin-bottom: 2px;
    }
    .toast-message {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.4;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .toast-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #334155;
    }
  `]
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts;

  close(id: string): void {
    this.toastService.remove(id);
  }
}
