import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Logo & Header -->
        <div class="auth-header">
          <div class="brand-badge">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v1"/><path d="M9 13v1"/><path d="M9 17v1"/></svg>
            </div>
            <div>
              <h1 class="portal-title">Society Loan Management</h1>
              <p class="portal-subtitle">Digital Microfinance & Member Loan Portal</p>
            </div>
          </div>
        </div>

        <!-- Role Selector Tabs -->
        <div class="role-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="loginType() === 'user'"
            (click)="setLoginType('user')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>User Login</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="loginType() === 'admin'"
            (click)="setLoginType('admin')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 9h-2"/><path d="M15 15h-2"/></svg>
            <span>Admin Login</span>
          </button>
        </div>

        <!-- Form Card -->
        <div class="form-wrapper">
          <div class="tab-description">
            <span *ngIf="loginType() === 'admin'" class="badge-role admin">Admin Portal Access</span>
            <span *ngIf="loginType() === 'user'" class="badge-role user">Registered Member Portal Access</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- User ID / Email -->
            <div class="form-group">
              <label for="identifier" class="form-label">
                {{ loginType() === 'admin' ? 'Admin Email Address' : 'User ID or Email Address' }}
                <span class="required">*</span>
              </label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
                </span>
                <input
                  id="identifier"
                  type="text"
                  class="form-control"
                  [class.is-invalid]="f['identifier'].touched && f['identifier'].invalid"
                  formControlName="identifier"
                  [placeholder]="loginType() === 'admin' ? 'sunilnirwan55@gmail.com' : 'user@gmail.com or SOCITY0001'"
                  autocomplete="username"
                />
              </div>
              <div class="invalid-feedback" *ngIf="f['identifier'].touched && f['identifier'].invalid">
                <span *ngIf="f['identifier'].errors?.['required']">Email or User ID is required.</span>
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password" class="form-label">
                Password <span class="required">*</span>
              </label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="f['password'].touched && f['password'].invalid"
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="btn-toggle-pwd"
                  (click)="showPassword.update(v => !v)"
                  tabindex="-1"
                >
                  <svg *ngIf="!showPassword()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg *ngIf="showPassword()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                </button>
              </div>
              <div class="invalid-feedback" *ngIf="f['password'].touched && f['password'].invalid">
                <span *ngIf="f['password'].errors?.['required']">Password is required.</span>
              </div>
            </div>

            <!-- Error message banner if any -->
            <div class="error-banner" *ngIf="errorMessage()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn-submit"
              [disabled]="loginForm.invalid || isLoading()"
            >
              <span *ngIf="!isLoading()" class="btn-text-content">
                <span>Sign In to {{ loginType() === 'admin' ? 'Admin Portal' : 'Member Portal' }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
              <span *ngIf="isLoading()" class="spinner-wrap">
                <span class="spinner"></span>
                <span>Verifying credentials...</span>
              </span>
            </button>
          </form>

          <!-- Register Link -->
          <div class="auth-footer" *ngIf="loginType() === 'user'">
            <p>
              Don't have a member account?
              <a routerLink="/register" class="register-link">Register New Account</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #1E3A8A 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
      overflow: hidden;
      animation: fadeInCard 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeInCard {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .auth-header {
      padding: 32px 32px 24px;
      background: #FAFCFF;
      border-bottom: 1px solid #EEF2F6;
    }
    .brand-badge {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #3155C8;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(49, 85, 200, 0.35);
      flex-shrink: 0;
    }
    .portal-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #172033;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .portal-subtitle {
      font-size: 0.8rem;
      color: #64748B;
      margin: 4px 0 0;
      font-weight: 500;
    }

    .role-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 8px 24px 0;
      background: #FAFCFF;
      gap: 8px;
    }
    .tab-btn {
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      font-weight: 700;
      font-size: 0.92rem;
      color: #64748B;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      color: #3155C8;
      border-bottom-color: #3155C8;
      background: #ffffff;
      border-radius: 10px 10px 0 0;
      box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.02);
    }

    .form-wrapper {
      padding: 28px 32px 32px;
    }
    .tab-description {
      margin-bottom: 20px;
    }
    .badge-role {
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
    }
    .badge-role.admin {
      background: #FEF3C7;
      color: #92400E;
    }
    .badge-role.user {
      background: #DCFCE7;
      color: #15803D;
    }

    .form-group {
      margin-bottom: 18px;
    }
    .form-label {
      display: block;
      font-size: 0.86rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }
    .required {
      color: #DC2626;
    }
    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      color: #94A3B8;
      pointer-events: none;
      display: flex;
    }
    .form-control {
      width: 100%;
      height: 46px;
      padding: 10px 42px 10px 44px;
      border-radius: 10px;
      border: 1.5px solid #E2E8F0;
      background: #F8FAFC;
      font-size: 0.92rem;
      color: #172033;
      font-family: inherit;
      transition: all 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: #3155C8;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(49, 85, 200, 0.12);
    }
    .form-control.is-invalid {
      border-color: #DC2626;
      background: #FFF5F5;
    }
    .btn-toggle-pwd {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
    }
    .btn-toggle-pwd:hover {
      color: #475569;
    }
    .invalid-feedback {
      font-size: 0.78rem;
      color: #DC2626;
      margin-top: 4px;
      font-weight: 500;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FEE2E2;
      border-left: 4px solid #DC2626;
      color: #991B1B;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.84rem;
      margin-bottom: 18px;
    }

    .btn-submit {
      width: 100%;
      height: 48px;
      background: #3155C8;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 0.96rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(49, 85, 200, 0.35);
      transition: all 0.2s;
    }
    .btn-submit:hover:not(:disabled) {
      background: #2643A3;
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(49, 85, 200, 0.45);
    }
    .btn-submit:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      box-shadow: none;
    }
    .btn-text-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 0.86rem;
      color: #64748B;
    }
    .register-link {
      color: #3155C8;
      font-weight: 700;
      text-decoration: none;
      margin-left: 4px;
    }
    .register-link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loginType = signal<'admin' | 'user'>('user');
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  loginForm: FormGroup = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  get f() {
    return this.loginForm.controls;
  }

  setLoginType(type: 'admin' | 'user'): void {
    this.loginType.set(type);
    this.errorMessage.set('');
    this.loginForm.reset();
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { identifier, password } = this.loginForm.value;

    try {
      const res = await this.authService.login(this.loginType(), identifier, password);
      this.isLoading.set(false);

      if (!res.success) {
        this.errorMessage.set(res.message);
        this.toast.error(res.message, 'Login Failed');
      }
    } catch (err: any) {
      this.isLoading.set(false);
      const msg = err.message || 'Authentication error. Please try again.';
      this.errorMessage.set(msg);
      this.toast.error(msg, 'Login Failed');
    }
  }
}
