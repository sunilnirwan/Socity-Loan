import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from './toast.service';
import { User } from '../models/user.model';
import { INITIAL_ADMIN } from '../constants/seed-data';

export interface LoggedInUser {
  id?: number;
  userId: string;
  name: string;
  email: string;
  mobile?: string;
  totalAmount?: number;
  role: 'admin' | 'user';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private storageService = inject(LocalStorageService);
  private router = inject(Router);
  private toast = inject(ToastService);

  private readonly USER_KEY = 'loggedInUser';
  private readonly ROLE_KEY = 'userRole';

  private currentUser$ = new BehaviorSubject<LoggedInUser | null>(this.getStoredUser());
  private userRole$ = new BehaviorSubject<'admin' | 'user' | null>(this.getStoredRole());

  constructor() {
    // Keep in sync if storage changes externally
    window.addEventListener('storage', () => {
      this.currentUser$.next(this.getStoredUser());
      this.userRole$.next(this.getStoredRole());
    });
  }

  private getStoredUser(): LoggedInUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private getStoredRole(): 'admin' | 'user' | null {
    const role = localStorage.getItem(this.ROLE_KEY);
    return role === 'admin' || role === 'user' ? role : null;
  }

  getCurrentUser$(): Observable<LoggedInUser | null> {
    return this.currentUser$.asObservable();
  }

  getUserRole$(): Observable<'admin' | 'user' | null> {
    return this.userRole$.asObservable();
  }

  getCurrentUser(): LoggedInUser | null {
    return this.currentUser$.value;
  }

  getUserRole(): 'admin' | 'user' | null {
    return this.userRole$.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser$.value && !!this.userRole$.value;
  }

  isAdmin(): boolean {
    return this.userRole$.value === 'admin';
  }

  isUser(): boolean {
    return this.userRole$.value === 'user';
  }

  login(type: 'admin' | 'user', idOrEmail: string, password: string): { success: boolean; message: string } {
    const cleanId = idOrEmail.trim().toLowerCase();

    if (type === 'admin') {
      const admin = this.storageService.getAdmin() || INITIAL_ADMIN;
      const validEmail = admin.email.toLowerCase();
      // Default password as specified in requirements: sunil@1234
      const validPassword = 'sunil@1234';

      if (cleanId === validEmail && password === validPassword) {
        const adminSession: LoggedInUser = {
          userId: 'ADMIN001',
          name: admin.name || 'Sunil Nirwan',
          email: admin.email,
          role: 'admin'
        };

        localStorage.setItem(this.USER_KEY, JSON.stringify(adminSession));
        localStorage.setItem(this.ROLE_KEY, 'admin');

        this.currentUser$.next(adminSession);
        this.userRole$.next('admin');

        this.toast.success(`Welcome back, ${adminSession.name}!`, 'Admin Login Successful');
        this.router.navigate(['/admin/dashboard']);
        return { success: true, message: 'Admin login successful' };
      } else {
        return { success: false, message: 'Invalid Admin email or password. Please verify credentials.' };
      }
    } else {
      // User login: search by email or userId
      const users = this.storageService.getUsers();
      const user = users.find(u =>
        u.email.toLowerCase() === cleanId ||
        u.userId.toLowerCase() === cleanId
      );

      if (!user) {
        return { success: false, message: 'No registered user found with this User ID or Email.' };
      }

      if (user.password !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      const userSession: LoggedInUser = {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        totalAmount: user.totalAmount,
        role: 'user',
        createdAt: user.createdAt
      };

      localStorage.setItem(this.USER_KEY, JSON.stringify(userSession));
      localStorage.setItem(this.ROLE_KEY, 'user');

      this.currentUser$.next(userSession);
      this.userRole$.next('user');

      this.toast.success(`Welcome, ${user.name}!`, 'Login Successful');
      this.router.navigate(['/user/dashboard']);
      return { success: true, message: 'User login successful' };
    }
  }

  updateCurrentUserProfile(updated: Partial<LoggedInUser>): void {
    const current = this.currentUser$.value;
    if (current) {
      const merged = { ...current, ...updated };
      localStorage.setItem(this.USER_KEY, JSON.stringify(merged));
      this.currentUser$.next(merged);
    }
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.currentUser$.next(null);
    this.userRole$.next(null);
    this.toast.info('You have been logged out successfully.', 'Logged Out');
    this.router.navigate(['/login']);
  }
}
