import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-take-loan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InrCurrencyPipe],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Apply for Society Loan</h1>
          <p class="page-subtitle">Simple, transparent 12-month fixed installment micro-credit for society members</p>
        </div>
      </div>

      <!-- Main Form & Real-time Calculator Grid -->
      <div class="loan-application-grid">
        <!-- Form Column -->
        <div class="card-form">
          <div class="form-header">
            <h3 class="card-title">Loan Application Details</h3>
            <span class="badge-fixed-term">12 Months Fixed Repayment</span>
          </div>

          <form [formGroup]="loanForm" (ngSubmit)="onSubmit()">
            <!-- Read-only Member Credentials -->
            <div class="member-readonly-box">
              <div class="readonly-row">
                <span class="r-lbl">Applicant Member ID:</span>
                <span class="r-val code-font">{{ currentUser?.userId }}</span>
              </div>
              <div class="readonly-row">
                <span class="r-lbl">Applicant Name:</span>
                <span class="r-val font-bold">{{ currentUser?.name }}</span>
              </div>
            </div>

            <!-- Loan Amount -->
            <div class="form-group">
              <label class="form-label" for="loanAmount">
                Loan Amount (₹) <span class="required">*</span>
              </label>
              <div class="input-with-symbol">
                <span class="currency-symbol">₹</span>
                <input
                  id="loanAmount"
                  type="number"
                  min="1000"
                  step="1000"
                  class="form-control"
                  [class.is-invalid]="f['loanAmount'].touched && f['loanAmount'].invalid"
                  formControlName="loanAmount"
                  placeholder="e.g. 12000, 24000, 60000"
                />
              </div>
              <div class="invalid-feedback" *ngIf="f['loanAmount'].touched && f['loanAmount'].invalid">
                <span *ngIf="f['loanAmount'].errors?.['required']">Loan amount is required.</span>
                <span *ngIf="f['loanAmount'].errors?.['min']">Minimum loan amount is ₹1,000.</span>
              </div>

              <!-- Quick Selection Presets -->
              <div class="amount-presets">
                <button type="button" class="preset-btn" (click)="setPresetAmount(12000)">₹12,000 (₹1k/mo)</button>
                <button type="button" class="preset-btn" (click)="setPresetAmount(24000)">₹24,000 (₹2k/mo)</button>
                <button type="button" class="preset-btn" (click)="setPresetAmount(36000)">₹36,000 (₹3k/mo)</button>
                <button type="button" class="preset-btn" (click)="setPresetAmount(60000)">₹60,000 (₹5k/mo)</button>
              </div>
            </div>

            <!-- Loan Purpose -->
            <div class="form-group">
              <label class="form-label" for="loanPurpose">
                Loan Purpose <span class="required">*</span>
              </label>
              <select
                id="loanPurpose"
                class="form-control select-control"
                [class.is-invalid]="f['loanPurpose'].touched && f['loanPurpose'].invalid"
                formControlName="loanPurpose"
              >
                <option value="" disabled>Select reason for loan</option>
                <option value="Emergency Medical Expenses">Emergency Medical Expenses</option>
                <option value="Home Renovation & Repair">Home Renovation & Repair</option>
                <option value="Higher Education & Course Fees">Higher Education & Course Fees</option>
                <option value="Small Business & Working Capital">Small Business & Working Capital</option>
                <option value="Family Event / Marriage Expenses">Family Event / Marriage Expenses</option>
                <option value="Agricultural Tools & Equipment">Agricultural Tools & Equipment</option>
                <option value="Vehicle Purchase / Repair">Vehicle Purchase / Repair</option>
                <option value="General Family Requirement">General Family Requirement</option>
              </select>
              <div class="invalid-feedback" *ngIf="f['loanPurpose'].touched && f['loanPurpose'].invalid">
                <span *ngIf="f['loanPurpose'].errors?.['required']">Please select the purpose of this loan.</span>
              </div>
            </div>

            <!-- Loan Disbursement Date -->
            <div class="form-group">
              <label class="form-label" for="loanDate">
                Application / Disbursement Date <span class="required">*</span>
              </label>
              <input
                id="loanDate"
                type="date"
                class="form-control"
                formControlName="loanDate"
              />
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn-submit"
              [disabled]="loanForm.invalid || isSubmitting()"
            >
              <span *ngIf="!isSubmitting()" class="btn-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Confirm & Submit Loan Request</span>
              </span>
              <span *ngIf="isSubmitting()" class="btn-text">Processing Loan...</span>
            </button>
          </form>
        </div>

        <!-- Real-time Calculator & Schedule Preview Column -->
        <div class="card-preview">
          <div class="preview-header">
            <h3 class="card-title">12-Month EMI Calculator Preview</h3>
            <span class="badge-rule">Fixed 12 Months Term</span>
          </div>

          <!-- Calculated Highlights -->
          <div class="calc-highlight-box">
            <div class="calc-row">
              <span class="calc-lbl">Requested Principal</span>
              <span class="calc-val">{{ (loanAmount() || 0) | inrCurrency }}</span>
            </div>
            <div class="calc-divider"></div>
            <div class="calc-row highlight">
              <span class="calc-lbl">Monthly EMI (Months 1 to 12)</span>
              <span class="calc-val emi-big">{{ monthlyEmi() | inrCurrency }}/month</span>
            </div>
            <div class="calc-row">
              <span class="calc-lbl">Total Repayable (12 EMIs)</span>
              <span class="calc-val font-bold">{{ (loanAmount() || 0) | inrCurrency }}</span>
            </div>
          </div>

          <!-- 12-Month Repayment Schedule Preview Table -->
          <div class="schedule-preview-table-wrap">
            <h4 class="preview-schedule-title">Projected Repayment Schedule (12 Months)</h4>
            <div class="table-scroll">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Due Date</th>
                    <th class="text-right">EMI Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of previewSchedule()">
                    <td><span class="pill-month">Month {{ item.installmentNumber }}</span></td>
                    <td>{{ item.dueDate }}</td>
                    <td class="text-right font-bold">{{ item.amount | inrCurrency }}</td>
                    <td><span class="badge-pending">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #172033;
      margin: 0;
    }
    .page-subtitle {
      font-size: 0.88rem;
      color: #64748B;
      margin: 4px 0 0;
    }

    .loan-application-grid {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 24px;
      align-items: flex-start;
    }

    .card-form, .card-preview {
      background: #ffffff;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-header, .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 1px solid #F1F5F9;
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #172033;
      margin: 0;
    }
    .badge-fixed-term, .badge-rule {
      font-size: 0.76rem;
      font-weight: 700;
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #DBEAFE;
    }

    .member-readonly-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .readonly-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.86rem;
    }
    .r-lbl { color: #64748B; font-weight: 600; }
    .r-val { color: #172033; }
    .code-font { font-family: monospace; font-weight: 700; color: #3155C8; }
    .font-bold { font-weight: 700; }

    .form-group {
      margin-bottom: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }
    .required { color: #DC2626; }
    .form-control {
      width: 100%;
      height: 44px;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1.5px solid #CBD5E1;
      font-size: 0.92rem;
      color: #172033;
      outline: none;
      transition: all 0.2s;
    }
    .form-control:focus {
      border-color: #3155C8;
      box-shadow: 0 0 0 3px rgba(49, 85, 200, 0.12);
    }
    .form-control.is-invalid { border-color: #DC2626; background: #FFF5F5; }
    .invalid-feedback { font-size: 0.78rem; color: #DC2626; }
    .select-control { cursor: pointer; background: #ffffff; }

    .input-with-symbol {
      position: relative;
      display: flex;
      align-items: center;
    }
    .currency-symbol {
      position: absolute;
      left: 14px;
      font-weight: 800;
      color: #64748B;
    }
    .input-with-symbol .form-control { padding-left: 32px; }

    .amount-presets {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .preset-btn {
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.76rem;
      font-weight: 700;
      color: #3155C8;
      cursor: pointer;
      transition: all 0.15s;
    }
    .preset-btn:hover {
      background: #EEF2FF;
      border-color: #3155C8;
    }

    .btn-submit {
      width: 100%;
      height: 48px;
      background: #3155C8;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
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
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
    }
    .btn-text { display: flex; align-items: center; gap: 8px; }

    /* Calculator Preview Styles */
    .calc-highlight-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
    }
    .calc-row.highlight {
      padding: 8px 0;
    }
    .calc-lbl { color: #64748B; font-weight: 600; }
    .calc-val { font-weight: 700; color: #172033; font-size: 1.05rem; }
    .emi-big { font-size: 1.45rem; font-weight: 800; color: #16A34A; }
    .calc-divider { height: 1px; background: #E2E8F0; margin: 4px 0; }

    .schedule-preview-table-wrap {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .preview-schedule-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #334155;
      margin: 0;
    }
    .table-scroll {
      max-height: 280px;
      overflow-y: auto;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
    }
    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }
    .preview-table th {
      background: #F8FAFC;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      color: #64748B;
      border-bottom: 1px solid #E2E8F0;
      position: sticky;
      top: 0;
    }
    .preview-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
    }
    .pill-month {
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .badge-pending {
      font-size: 0.72rem;
      background: #FEF3C7;
      color: #B45309;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .text-right { text-align: right; }

    @media (max-width: 960px) {
      .loan-application-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TakeLoanComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private loanService = inject(LoanService);
  private confirm = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private router = inject(Router);

  currentUser = this.authService.getCurrentUser();
  isSubmitting = signal<boolean>(false);

  loanForm: FormGroup = this.fb.group({
    loanAmount: [12000, [Validators.required, Validators.min(1000)]],
    loanPurpose: ['Emergency Medical Expenses', [Validators.required]],
    loanDate: [new Date().toISOString().split('T')[0], [Validators.required]]
  });

  ngOnInit(): void {}

  get f() {
    return this.loanForm.controls;
  }

  loanAmount(): number {
    return Number(this.loanForm.get('loanAmount')?.value) || 0;
  }

  monthlyEmi(): number {
    return this.loanService.calculateEMI(this.loanAmount());
  }

  previewSchedule() {
    return this.loanService.generateSchedule(
      this.loanAmount(),
      this.loanForm.get('loanDate')?.value || new Date().toISOString()
    );
  }

  setPresetAmount(amt: number): void {
    this.loanForm.patchValue({ loanAmount: amt });
  }

  async onSubmit(): Promise<void> {
    if (this.loanForm.invalid || !this.currentUser) {
      this.loanForm.markAllAsTouched();
      return;
    }

    const val = this.loanForm.value;
    const emi = this.monthlyEmi();

    const ok = await this.confirm.confirm({
      title: 'Confirm Loan Application',
      message: `You are applying for a Society Loan of ₹${Number(val.loanAmount).toLocaleString('en-IN')}.\n\nFixed Term: 12 Months\nMonthly EMI: ₹${emi.toLocaleString('en-IN')}/month\nPurpose: ${val.loanPurpose}\n\nDo you wish to proceed?`,
      confirmText: 'Yes, Apply Now',
      cancelText: 'Cancel',
      type: 'primary'
    });

    if (!ok) return;

    this.isSubmitting.set(true);

    setTimeout(() => {
      const res = this.loanService.createLoan({
        userId: this.currentUser!.userId,
        loanAmount: Number(val.loanAmount),
        loanPurpose: val.loanPurpose,
        loanDate: val.loanDate
      });

      this.isSubmitting.set(false);

      if (res.success) {
        this.toast.success(res.message, 'Loan Created Successfully');
        this.router.navigate(['/user/loans']);
      } else {
        this.toast.error(res.message, 'Loan Request Failed');
      }
    }, 400);
  }
}
