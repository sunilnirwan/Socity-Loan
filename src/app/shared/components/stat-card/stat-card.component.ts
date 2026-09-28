import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe],
  template: `
    <div class="stat-card" [ngClass]="'card-' + colorScheme">
      <div class="stat-header">
        <span class="stat-title">{{ title }}</span>
        <div class="stat-icon-wrapper" [ngClass]="'icon-' + colorScheme">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      <div class="stat-body">
        <div class="stat-value">
          <ng-container *ngIf="isCurrency">
            {{ value | inrCurrency }}
          </ng-container>
          <ng-container *ngIf="!isCurrency">
            {{ value }}
          </ng-container>
        </div>
        <div class="stat-subtitle" *ngIf="subtitle">
          <span class="badge-dot" [ngClass]="'dot-' + colorScheme"></span>
          {{ subtitle }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 22px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px -6px rgba(49, 85, 200, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04);
      border-color: #CBD5E1;
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .stat-title {
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748B;
    }
    .stat-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-primary { background: #EEF2FF; color: #3155C8; }
    .icon-success { background: #DCFCE7; color: #16A34A; }
    .icon-warning { background: #FEF3C7; color: #D97706; }
    .icon-danger  { background: #FEE2E2; color: #DC2626; }
    .icon-purple  { background: #F3E8FF; color: #9333EA; }
    .icon-cyan    { background: #E0F2FE; color: #0284C7; }

    .stat-value {
      font-size: 1.85rem;
      font-weight: 800;
      color: #172033;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .stat-subtitle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: #64748B;
      margin-top: 8px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-primary { background: #3155C8; }
    .dot-success { background: #16A34A; }
    .dot-warning { background: #F59E0B; }
    .dot-danger  { background: #DC2626; }
    .dot-purple  { background: #9333EA; }
    .dot-cyan    { background: #0284C7; }
  `]
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: number | string = 0;
  @Input() subtitle?: string;
  @Input() isCurrency: boolean = true;
  @Input() colorScheme: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' = 'primary';
}
