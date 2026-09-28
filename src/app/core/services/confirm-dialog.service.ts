import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'warning' | 'success';
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogState$ = new BehaviorSubject<ConfirmDialogData | null>(null);
  dialogState = this.dialogState$.asObservable();

  confirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'primary' | 'danger' | 'warning' | 'success';
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogState$.next({
        ...options,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'primary',
        resolve
      });
    });
  }

  handleAnswer(answer: boolean): void {
    const current = this.dialogState$.value;
    if (current && current.resolve) {
      current.resolve(answer);
    }
    this.dialogState$.next(null);
  }
}
