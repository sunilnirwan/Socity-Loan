import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { map } from 'rxjs';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, InrCurrencyPipe],
  template: `
    <div class="layout-container">
      <!-- Mobile Backdrop -->
      <div
        class="mobile-backdrop"
        *ngIf="isMobileOpen()"
        (click)="isMobileOpen.set(false)"
      ></div>

      <!-- USER SIDEBAR -->
      <aside class="sidebar" [class.mobile-open]="isMobileOpen()">
        <div class="sidebar-header">
          <div class="brand-logo">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
            <div class="brand-text">
              <span class="brand-title">SOCIETY LOAN</span>
              <span class="brand-subtitle">Member Portal</span>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <div class="nav-section-title">MENU</div>
          <a
            routerLink="/user/dashboard"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <span class="nav-label">Dashboard</span>
          </a>

          <a
            routerLink="/user/profile"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span class="nav-label">My Profile</span>
          </a>

          <a
            routerLink="/user/take-loan"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            <span class="nav-label">Take Loan</span>
          </a>

          <a
            routerLink="/user/loans"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M7 15h.01"/><path d="M17 15h.01"/></svg>
            <span class="nav-label">My Loans</span>
          </a>

          <a
            routerLink="/user/payments"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span class="nav-label">Payments</span>
          </a>

          <a
            routerLink="/user/transactions"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 10v12"/><path d="M11 14v8"/><path d="m3 6 9-4 9 4v2H3V6z"/></svg>
            <span class="nav-label">Transactions</span>
          </a>

          <div class="nav-section-title" style="margin-top: 24px;">SESSION</div>

          <button class="nav-link nav-link-btn text-danger-btn" (click)="onLogout()">
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span class="nav-label">Logout</span>
          </button>
        </nav>

        <!-- Sidebar Footer Member Chip -->
        <div class="sidebar-footer">
          <div class="member-chip" *ngIf="user$ | async as user">
            <div class="member-avatar">{{ user.name.charAt(0) }}</div>
            <div class="member-info">
              <span class="member-name">{{ user.name }}</span>
              <span class="member-id">{{ user.userId }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <div class="main-wrapper">
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn-icon mobile-menu-btn" (click)="isMobileOpen.set(true)">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <div class="member-badge" *ngIf="user$ | async as user">
              <span class="badge-dot"></span>
              Member: <b>{{ user.userId }}</b>
            </div>
          </div>

          <div class="topbar-right">
            <!-- Balance Card Chip in Topbar -->
            <div class="balance-pill" *ngIf="user$ | async as user">
              <span class="balance-lbl">My Balance</span>
              <span class="balance-val">{{ (user.totalAmount || 0) | inrCurrency }}</span>
            </div>

            <!-- Quick Apply Loan Button -->
            <a routerLink="/user/take-loan" class="btn btn-take-loan-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              <span>Take Loan</span>
            </a>
          </div>
        </header>

        <!-- PAGE OUTLET -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      background: #F5F7FB;
    }
    .sidebar {
      width: 260px;
      background: #111827;
      color: #F8FAFC;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 1000;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
    }
    .sidebar-header {
      padding: 24px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #3155C8;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(49, 85, 200, 0.4);
    }
    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #ffffff;
      display: block;
      line-height: 1.1;
    }
    .brand-subtitle {
      font-size: 0.72rem;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
    }
    .nav-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.08em;
      padding: 0 12px 6px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 10px;
      color: #94A3B8;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
    }
    .nav-link:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.06);
    }
    .nav-link.active {
      background: #3155C8;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(49, 85, 200, 0.35);
    }
    .text-danger-btn:hover {
      background: rgba(220, 38, 38, 0.15) !important;
      color: #F87171 !important;
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.2);
    }
    .member-chip {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .member-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #3155C8;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .member-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .member-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .member-id {
      font-size: 0.72rem;
      color: #93C5FD;
      font-family: monospace;
      font-weight: 600;
    }

    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: margin 0.3s ease;
    }
    .topbar {
      height: 70px;
      background: #ffffff;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 999;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #334155;
      padding: 6px;
      border-radius: 8px;
    }
    .member-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #EEF2FF;
      color: #3155C8;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
    }
    .member-badge .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #16A34A;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .balance-pill {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 6px 14px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
    }
    .balance-lbl {
      font-size: 0.68rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748B;
    }
    .balance-val {
      font-size: 0.95rem;
      font-weight: 800;
      color: #16A34A;
    }

    .btn-take-loan-sm {
      background: #3155C8;
      color: #ffffff;
      text-decoration: none;
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 0.86rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(49, 85, 200, 0.3);
      transition: all 0.15s;
    }
    .btn-take-loan-sm:hover {
      background: #2643A3;
      transform: translateY(-1px);
    }

    .content-area {
      flex: 1;
      padding: 32px;
    }

    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
      .main-wrapper {
        margin-left: 0;
      }
      .mobile-menu-btn {
        display: block;
      }
      .mobile-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }
      .topbar {
        padding: 0 16px;
      }
      .content-area {
        padding: 16px;
      }
    }
  `]
})
export class UserLayoutComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private confirm = inject(ConfirmDialogService);

  isMobileOpen = signal<boolean>(false);

  // Keep live user balance updated
  user$ = this.authService.getCurrentUser$().pipe(
    map(sessionUser => {
      if (!sessionUser) return null;
      const liveUser = this.userService.getUserById(sessionUser.userId);
      return liveUser || sessionUser;
    })
  );

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  async onLogout(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to sign out from your member account?',
      confirmText: 'Yes, Logout',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (ok) {
      this.authService.logout();
    }
  }
}
