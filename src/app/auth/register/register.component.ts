import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;

  if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
    return null;
  }

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    confirmPassword.setErrors(null);
    return null;
  }
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-badge">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
            </div>
            <div>
              <h1 class="portal-title">Member Registration</h1>
              <p class="portal-subtitle">Join the Society Loan & Savings Network</p>
            </div>
          </div>
        </div>

        <div class="form-wrapper">
          <!-- Next Assigned ID Banner -->
          <div class="id-preview-banner">
            <div class="id-info">
              <span class="id-label">Assigned Member ID</span>
              <span class="id-code">{{ nextUserId() }}</span>
            </div>
            <span class="badge-auto">Auto-Generated</span>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <!-- Full Name -->
            <div class="form-group">
              <label for="name" class="form-label">
                Full Name <span class="required">*</span>
              </label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  id="name"
                  type="text"
                  class="form-control"
                  [class.is-invalid]="f['name'].touched && f['name'].invalid"
                  formControlName="name"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div class="invalid-feedback" *ngIf="f['name'].touched && f['name'].invalid">
                <span *ngIf="f['name'].errors?.['required']">Full Name is required.</span>
                <span *ngIf="f['name'].errors?.['minlength']">Name must be at least 2 characters.</span>
              </div>
            </div>

            <!-- Mobile Number -->
            <div class="form-group">
              <label for="mobile" class="form-label">
                Mobile Number (10 Digits) <span class="required">*</span>
              </label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <input
                  id="mobile"
                  type="tel"
                  maxlength="10"
                  class="form-control"
                  [class.is-invalid]="f['mobile'].touched && f['mobile'].invalid"
                  formControlName="mobile"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div class="invalid-feedback" *ngIf="f['mobile'].touched && f['mobile'].invalid">
                <span *ngIf="f['mobile'].errors?.['required']">Mobile number is required.</span>
                <span *ngIf="f['mobile'].errors?.['pattern']">Must be exactly 10 digits (0-9).</span>
              </div>
            </div>

            <!-- Email Address -->
            <div class="form-group">
              <label for="email" class="form-label">
                Email Address <span class="required">*</span>
              </label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  [class.is-invalid]="f['email'].touched && f['email'].invalid"
                  formControlName="email"
                  placeholder="e.g. ramesh@gmail.com"
                />
              </div>
              <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].invalid">
                <span *ngIf="f['email'].errors?.['required']">Email address is required.</span>
                <span *ngIf="f['email'].errors?.['email']">Please enter a valid email format.</span>
              </div>
            </div>

            <!-- Password & Confirm Password Row -->
            <div class="form-row">
              <div class="form-group col">
                <label for="reg-password" class="form-label">
                  Password <span class="required">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  class="form-control"
                  [class.is-invalid]="f['password'].touched && f['password'].invalid"
                  formControlName="password"
                  placeholder="Min 6 chars"
                />
                <div class="invalid-feedback" *ngIf="f['password'].touched && f['password'].invalid">
                  <span *ngIf="f['password'].errors?.['required']">Password is required.</span>
                  <span *ngIf="f['password'].errors?.['minlength']">Min 6 characters.</span>
                </div>
              </div>

              <div class="form-group col">
                <label for="confirmPassword" class="form-label">
                  Confirm Password <span class="required">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  class="form-control"
                  [class.is-invalid]="f['confirmPassword'].touched && f['confirmPassword'].invalid"
                  formControlName="confirmPassword"
                  placeholder="Re-enter password"
                />
                <div class="invalid-feedback" *ngIf="f['confirmPassword'].touched && f['confirmPassword'].invalid">
                  <span *ngIf="f['confirmPassword'].errors?.['required']">Please confirm password.</span>
                  <span *ngIf="f['confirmPassword'].errors?.['passwordMismatch']">Passwords do not match.</span>
                </div>
              </div>
            </div>

            <!-- Optional Details: Address & Occupation -->
            <div class="form-row">
              <div class="form-group col">
                <label for="occupation" class="form-label">Occupation</label>
                <input
                  id="occupation"
                  type="text"
                  class="form-control"
                  formControlName="occupation"
                  placeholder="e.g. Teacher, Business"
                />
              </div>
              <div class="form-group col">
                <label for="address" class="form-label">City / Address</label>
                <input
                  id="address"
                  type="text"
                  class="form-control"
                  formControlName="address"
                  placeholder="e.g. Jaipur"
                />
              </div>
            </div>

            <!-- Error Banner -->
            <div class="error-banner" *ngIf="errorMessage()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn-submit"
              [disabled]="registerForm.invalid || isLoading()"
            >
              <span *ngIf="!isLoading()" class="btn-text-content">
                <span>Complete Registration</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
              <span *ngIf="isLoading()" class="spinner-wrap">
                <span class="spinner"></span>
                <span>Registering member...</span>
              </span>
            </button>
          </form>

          <div class="auth-footer">
            <p>
              Already registered?
              <a routerLink="/login" class="login-link">Sign In to Portal</a>
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
      max-width: 520px;
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
      padding: 28px 32px 20px;
      background: #FAFCFF;
      border-bottom: 1px solid #EEF2F6;
    }
    .brand-badge {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
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
    }
    .portal-subtitle {
      font-size: 0.8rem;
      color: #64748B;
      margin: 4px 0 0;
    }

    .form-wrapper {
      padding: 28px 32px 32px;
    }

    .id-preview-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .id-info {
      display: flex;
      flex-direction: column;
    }
    .id-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #3B82F6;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .id-code {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1D4ED8;
      font-family: monospace;
    }
    .badge-auto {
      background: #DBEAFE;
      color: #1E40AF;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .form-row {
      display: flex;
      gap: 14px;
    }
    .form-row .col {
      flex: 1;
    }

    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      font-size: 0.84rem;
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
      height: 44px;
      padding: 10px 14px 10px 42px;
      border-radius: 10px;
      border: 1.5px solid #E2E8F0;
      background: #F8FAFC;
      font-size: 0.9rem;
      color: #172033;
      font-family: inherit;
      transition: all 0.2s;
    }
    .form-row .form-control:not(.input-with-icon .form-control) {
      padding-left: 14px;
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
      margin-bottom: 16px;
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
      margin-top: 8px;
    }
    .btn-submit:hover:not(:disabled) {
      background: #2643A3;
      transform: translateY(-1px);
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
    .login-link {
      color: #3155C8;
      font-weight: 700;
      text-decoration: none;
      margin-left: 4px;
    }
    .login-link:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  nextUserId = signal<string>('SOCITY0001');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    address: ['Jaipur, Rajasthan'],
    occupation: ['Member']
  }, { validators: passwordMatchValidator });

  ngOnInit(): void {
    this.refreshNextId();
  }

  get f() {
    return this.registerForm.controls;
  }

  refreshNextId(): void {
    this.nextUserId.set(this.userService.generateNextUserId());
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const val = this.registerForm.value;

    try {
      const result = await this.userService.registerUser({
        name: val.name,
        mobile: val.mobile,
        email: val.email,
        password: val.password,
        address: val.address,
        occupation: val.occupation
      });

      this.isLoading.set(false);

      if (!result.success) {
        this.errorMessage.set(result.message);
        this.toast.error(result.message, 'Registration Error');
        return;
      }

      this.toast.success(`Account created with ID: ${result.user?.userId}! Please log in.`, 'Registration Successful');
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.isLoading.set(false);
      const msg = err.message || 'Registration failed. Please try again.';
      this.errorMessage.set(msg);
      this.toast.error(msg, 'Registration Error');
    }
  }
}
