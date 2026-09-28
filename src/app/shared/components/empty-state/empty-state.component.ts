import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon-circle">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
      </div>
      <h4 class="empty-title">{{ title }}</h4>
      <p class="empty-description" *ngIf="description">{{ description }}</p>
      <button *ngIf="actionText" class="btn btn-primary btn-sm" (click)="action.emit()">
        {{ actionText }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .empty-icon-circle {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #F1F5F9;
      color: #94A3B8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #334155;
      margin: 0 0 6px 0;
    }
    .empty-description {
      font-size: 0.9rem;
      color: #64748B;
      max-width: 360px;
      margin: 0 0 18px 0;
      line-height: 1.4;
    }
    .btn-primary {
      background: #3155C8;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 0.88rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover {
      background: #2643A3;
    }
  `]
})
export class EmptyStateComponent {
  @Input() title: string = 'No records found';
  @Input() description?: string;
  @Input() actionText?: string;
  @Output() action = new EventEmitter<void>();
}
