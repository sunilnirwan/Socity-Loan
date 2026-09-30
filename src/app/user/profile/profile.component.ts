import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InrCurrencyPipe],
  template: `
    <div class="page-container" *ngIf="user()">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Member Profile & Settings</h1>
          <p class="page-subtitle">Manage your personal information, address, and login credentials</p>
        </div>
      </div>

      <div class="profile-grid">
        <!-- Profile Overview Card -->
        <div class="card-left">
          <div class="avatar-large">{{ user()?.name?.charAt(0) }}</div>
          <h2 class="user-fullname">{{ user()?.name }}</h2>
          <span class="user-id-badge">{{ user()?.userId }}</span>
          <span class="user-occ">{{ user()?.occupation || 'Society Member' }}</span>

          <div class="balance-card">
            <span class="b-lbl">Society Account Balance</span>
            <span class="b-val">{{ (user()?.totalAmount || 0) | inrCurrency }}</span>
            <span class="b-sub">Available savings & contributions</span>
          </div>

          <div class="meta-list">
            <div class="meta-row">
              <span class="m-lbl">Member Since</span>
              <span class="m-val">{{ user()?.createdAt }}</span>
            </div>
            <div class="meta-row">
              <span class="m-lbl">Membership Status</span>
              <span class="badge badge-success">Active Member</span>
            </div>
          </div>
        </div>

        <!-- Edit Profile & Change Password Form -->
        <div class="card-right">
          <h3 class="card-title">Edit Profile Information</h3>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-form">
            <div class="form-row">
              <div class="form-group col">
                <label class="form-label">Full Name <span class="required">*</span></label>
                <input type="text" class="form-control" formControlName="name" />
              </div>
              <div class="form-group col">
                <label class="form-label">Occupation</label>
                <input type="text" class="form-control" formControlName="occupation" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label class="form-label">Mobile Number</label>
                <input type="tel" class="form-control" formControlName="mobile" readonly />
                <span class="input-hint">Mobile number is fixed to your Member ID.</span>
              </div>
              <div class="form-group col">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control" formControlName="email" readonly />
                <span class="input-hint">Email address is registered with your account.</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Address / Location</label>
              <input type="text" class="form-control" formControlName="address" />
            </div>

            <div class="form-group">
              <label class="form-label">Change Account Password</label>
              <input type="password" class="form-control" formControlName="password" placeholder="Enter new password (optional)" />
              <span class="input-hint">Leave blank to keep your current password.</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isSaving()">
                {{ isSaving() ? 'Saving Changes...' : 'Save Profile Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #172033; margin: 0; }
    .page-subtitle { font-size: 0.88rem; color: #64748B; margin: 4px 0 0; }

    .profile-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
      align-items: flex-start;
    }

    .card-left {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .avatar-large {
      width: 76px;
      height: 76px;
      border-radius: 20px;
      background: #3155C8;
      color: #ffffff;
      font-size: 2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
      box-shadow: 0 8px 20px rgba(49, 85, 200, 0.35);
    }
    .user-fullname { font-size: 1.25rem; font-weight: 800; color: #172033; margin: 0 0 4px 0; }
    .user-id-badge {
      font-family: monospace;
      font-size: 0.84rem;
      font-weight: 700;
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #DBEAFE;
      margin-bottom: 6px;
    }
    .user-occ { font-size: 0.82rem; color: #64748B; margin-bottom: 18px; }

    .balance-card {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 12px;
      padding: 16px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 18px;
    }
    .b-lbl { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #15803D; }
    .b-val { font-size: 1.5rem; font-weight: 800; color: #15803D; margin: 4px 0 2px; }
    .b-sub { font-size: 0.72rem; color: #4ade80; }

    .meta-list { width: 100%; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #F1F5F9; padding-top: 16px; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; }
    .m-lbl { color: #64748B; }
    .m-val { font-weight: 600; color: #1E293B; }
    .badge-success { background: #DCFCE7; color: #15803D; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.74rem; }

    .card-right {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card-title { font-size: 1.15rem; font-weight: 800; color: #172033; margin: 0; }

    .profile-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 14px; }
    .form-row .col { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 0.85rem; font-weight: 600; color: #334155; }
    .required { color: #DC2626; }
    .form-control { width: 100%; height: 44px; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #CBD5E1; font-size: 0.92rem; color: #172033; outline: none; }
    .form-control:focus { border-color: #3155C8; box-shadow: 0 0 0 3px rgba(49, 85, 200, 0.12); }
    .input-hint { font-size: 0.74rem; color: #94A3B8; }

    .form-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
    .btn { padding: 10px 20px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; border: none; }
    .btn-primary { background: #3155C8; color: #ffffff; box-shadow: 0 4px 12px rgba(49, 85, 200, 0.25); }
    .btn-primary:hover { background: #2643A3; }

    @media (max-width: 900px) {
      .profile-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  user = signal<User | null>(null);
  isSaving = signal<boolean>(false);

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    mobile: [''],
    email: [''],
    occupation: [''],
    address: [''],
    password: ['']
  });

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe(session => {
      if (session) {
        this.userService.getUsers$().subscribe(users => {
          const live = users.find(u => (session.uid && u.uid === session.uid) || u.userId.toUpperCase() === session.userId.toUpperCase()) || session;
          this.user.set(live as User);
          this.profileForm.patchValue({
            name: live.name,
            mobile: live.mobile,
            email: live.email,
            occupation: live.occupation || '',
            address: live.address || ''
          });
        });
      }
    });
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid || !this.user()) return;

    this.isSaving.set(true);
    const val = this.profileForm.value;

    const updates: Partial<User> = {
      name: val.name,
      occupation: val.occupation,
      address: val.address
    };

    try {
      await this.userService.updateUser(this.user()!.userId, updates);
      await this.authService.updateCurrentUserProfile({
        name: val.name,
        occupation: val.occupation,
        address: val.address
      });
      this.user.set({ ...this.user()!, ...updates });
      this.isSaving.set(false);
      this.toast.success('Your profile details were updated successfully!', 'Profile Saved');
    } catch (err: any) {
      this.isSaving.set(false);
      this.toast.error(err.message || 'Failed to update profile.', 'Error');
    }
  }
}
