import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { AppNotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout-container" [class.sidebar-collapsed]="isSidebarCollapsed()">
      <!-- Mobile Backdrop -->
      <div
        class="mobile-backdrop"
        *ngIf="isMobileOpen()"
        (click)="isMobileOpen.set(false)"
      ></div>

      <!-- SIDEBAR -->
      <aside class="sidebar" [class.mobile-open]="isMobileOpen()">
        <div class="sidebar-header">
          <div class="brand-logo">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v1"/><path d="M9 13v1"/><path d="M9 17v1"/></svg>
            </div>
            <div class="brand-text">
              <span class="brand-title">SOCIETY</span>
              <span class="brand-subtitle">Loan Admin</span>
            </div>
          </div>
          <button class="btn-icon sidebar-toggle-btn" (click)="toggleSidebar()" title="Toggle Sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9-3 3 3 3"/></svg>
          </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <div class="nav-section-title">MAIN MENU</div>
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <span class="nav-label">Dashboard</span>
          </a>

          <a
            routerLink="/admin/users"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="nav-label">Users</span>
          </a>

          <a
            routerLink="/admin/loans"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M7 15h.01"/><path d="M17 15h.01"/></svg>
            <span class="nav-label">Loans</span>
          </a>

          <a
            routerLink="/admin/transactions"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 10v12"/><path d="M11 14v8"/><path d="m3 6 9-4 9 4v2H3V6z"/></svg>
            <span class="nav-label">Transactions</span>
          </a>

          <a
            routerLink="/admin/notifications"
            routerLinkActive="active"
            (click)="closeMobile()"
            class="nav-link"
          >
            <div class="nav-icon-badge-wrap">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span class="bubble-counter" *ngIf="(unreadCount$ | async) as count">{{ count }}</span>
            </div>
            <span class="nav-label">Notifications</span>
          </a>

          <div class="nav-section-title" style="margin-top: 24px;">ACCOUNT</div>

          <button class="nav-link nav-link-btn text-danger-btn" (click)="onLogout()">
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span class="nav-label">Logout</span>
          </button>
        </nav>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <div class="admin-profile-chip">
            <div class="admin-avatar">A</div>
            <div class="admin-info">
              <span class="admin-name">{{ (currentUser$ | async)?.name || 'Admin' }}</span>
              <span class="admin-role">Chief Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="main-wrapper">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn-icon mobile-menu-btn" (click)="isMobileOpen.set(true)">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <div class="portal-badge">
              <span class="badge-dot"></span>
              Admin Control Center
            </div>
          </div>

          <div class="topbar-right">
            <!-- Notification Bell -->
            <div class="notif-bell-container">
              <button class="btn-icon notif-bell-btn" (click)="toggleNotifDropdown()" title="Notifications">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <span class="notif-badge-dot" *ngIf="(unreadCount$ | async) as count">{{ count }}</span>
              </button>

              <!-- Notifications Dropdown -->
              <div class="notif-dropdown" *ngIf="isNotifDropdownOpen()">
                <div class="dropdown-header">
                  <span class="dropdown-title">Notifications</span>
                  <button class="btn-text-sm" (click)="markAllRead()">Mark all read</button>
                </div>
                <div class="dropdown-list">
                  <div
                    *ngFor="let notif of (notifications$ | async)?.slice(0, 5)"
                    class="dropdown-item"
                    [class.unread]="!notif.isRead"
                    (click)="openNotif(notif)"
                  >
                    <div class="item-icon" [ngClass]="'icon-' + notif.type">
                      <svg *ngIf="notif.type === 'taken_loan'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="m8 12 4 4 4-4"/></svg>
                      <svg *ngIf="notif.type === 'installment_paid'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <svg *ngIf="notif.type === 'loan_completed'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1s-1-.45-1-1v-2.34c0-.36.19-.69.5-.86l2.5-1.4c.31-.17.69-.17 1 0l2.5 1.4c.31.17.5.5.5.86V17c0 .55-.45 1-1 1s-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                      <svg *ngIf="notif.type === 'admin_credit' || notif.type === 'system'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                    <div class="item-text">
                      <div class="item-title">{{ notif.title }}</div>
                      <div class="item-msg">{{ notif.message }}</div>
                      <span class="item-date">{{ notif.createdAt }}</span>
                    </div>
                  </div>
                  <div *ngIf="!(notifications$ | async)?.length" class="empty-notif">
                    No notifications
                  </div>
                </div>
                <div class="dropdown-footer">
                  <a routerLink="/admin/notifications" (click)="isNotifDropdownOpen.set(false)">View all notifications →</a>
                </div>
              </div>
            </div>

            <!-- Admin Profile Topbar Button -->
            <div class="topbar-user">
              <div class="user-avatar-sm">A</div>
              <div class="user-meta">
                <span class="meta-name">{{ (currentUser$ | async)?.name || 'Sunil Nirwan' }}</span>
                <span class="meta-role">Admin</span>
              </div>
            </div>
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
      background: #0F172A;
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
    .sidebar-toggle-btn {
      color: #94A3B8;
      display: none;
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
    .nav-icon {
      flex-shrink: 0;
    }
    .nav-icon-badge-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .bubble-counter {
      position: absolute;
      top: -6px;
      right: -10px;
      background: #DC2626;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 999px;
      min-width: 16px;
      text-align: center;
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
    .admin-profile-chip {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .admin-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #3155C8;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .admin-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .admin-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .admin-role {
      font-size: 0.72rem;
      color: #94A3B8;
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
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
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
    .portal-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #EEF2FF;
      color: #3155C8;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 20px;
    }
    .portal-badge .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #3155C8;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .notif-bell-container {
      position: relative;
    }
    .notif-bell-btn {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.15s;
    }
    .notif-bell-btn:hover {
      background: #E2E8F0;
      color: #1E293B;
    }
    .notif-badge-dot {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #DC2626;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 999px;
      border: 2px solid #ffffff;
    }

    .notif-dropdown {
      position: absolute;
      top: 52px;
      right: 0;
      width: 360px;
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 1000;
      overflow: hidden;
      animation: dropDownAnim 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dropDownAnim {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dropdown-header {
      padding: 14px 18px;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F8FAFC;
    }
    .dropdown-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #172033;
    }
    .btn-text-sm {
      background: none;
      border: none;
      color: #3155C8;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .dropdown-list {
      max-height: 320px;
      overflow-y: auto;
    }
    .dropdown-item {
      padding: 12px 16px;
      display: flex;
      gap: 12px;
      border-bottom: 1px solid #F8FAFC;
      cursor: pointer;
      transition: background 0.15s;
    }
    .dropdown-item:hover {
      background: #F8FAFC;
    }
    .dropdown-item.unread {
      background: #EFF6FF;
    }
    .item-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-taken_loan { background: #DCFCE7; color: #16A34A; }
    .icon-installment_paid { background: #DBEAFE; color: #2563EB; }
    .icon-loan_completed { background: #FEF3C7; color: #D97706; }
    .icon-admin_credit, .icon-system { background: #F3E8FF; color: #9333EA; }
    .item-text {
      flex: 1;
    }
    .item-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #1E293B;
    }
    .item-msg {
      font-size: 0.78rem;
      color: #64748B;
      line-height: 1.3;
      margin: 2px 0 4px;
    }
    .item-date {
      font-size: 0.7rem;
      color: #94A3B8;
    }
    .empty-notif {
      padding: 24px;
      text-align: center;
      color: #94A3B8;
      font-size: 0.85rem;
    }
    .dropdown-footer {
      padding: 10px;
      text-align: center;
      background: #F8FAFC;
      border-top: 1px solid #F1F5F9;
    }
    .dropdown-footer a {
      color: #3155C8;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
    }

    .topbar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      border-radius: 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
    }
    .user-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #3155C8;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
    }
    .meta-name {
      font-size: 0.84rem;
      font-weight: 700;
      color: #172033;
    }
    .meta-role {
      font-size: 0.7rem;
      color: #64748B;
      font-weight: 500;
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
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private confirm = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private router = inject(Router);

  isSidebarCollapsed = signal<boolean>(false);
  isMobileOpen = signal<boolean>(false);
  isNotifDropdownOpen = signal<boolean>(false);

  currentUser$ = this.authService.getCurrentUser$();
  unreadCount$ = this.notifService.getUnreadCount$();
  notifications$ = this.notifService.getNotifications$();

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  toggleNotifDropdown(): void {
    this.isNotifDropdownOpen.update(v => !v);
  }

  markAllRead(): void {
    this.notifService.markAllAsRead();
  }

  openNotif(notif: AppNotification): void {
    if (notif.id) {
      this.notifService.markAsRead(notif.id);
    }
    this.isNotifDropdownOpen.set(false);
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  async onLogout(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to sign out from the Admin portal?',
      confirmText: 'Yes, Sign Out',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (ok) {
      this.authService.logout();
    }
  }
}
