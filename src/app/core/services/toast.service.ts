import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  toasts = this.toasts$.asObservable();

  show(type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string, duration: number = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, message, title, duration };
    
    this.toasts$.next([...this.toasts$.value, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, title: string = 'Success!'): void {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'Error'): void {
    this.show('error', message, title, 5000);
  }

  warning(message: string, title: string = 'Warning'): void {
    this.show('warning', message, title);
  }

  info(message: string, title: string = 'Information'): void {
    this.show('info', message, title);
  }

  remove(id: string): void {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
