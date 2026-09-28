import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';
import { Loan } from '../models/loan.model';
import { Payment } from '../models/payment.model';
import { Transaction } from '../models/transaction.model';
import { AppNotification } from '../models/notification.model';
import { AdminConfig } from '../models/admin.model';
import {
  INITIAL_ADMIN,
  INITIAL_USERS,
  INITIAL_LOANS,
  INITIAL_PAYMENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS
} from '../constants/seed-data';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private http = inject(HttpClient);

  private readonly KEYS = {
    USERS: 'society_users',
    LOANS: 'society_loans',
    PAYMENTS: 'society_payments',
    TRANSACTIONS: 'society_transactions',
    NOTIFICATIONS: 'society_notifications',
    ADMIN: 'society_admin',
    INITIALIZED: 'society_initialized_v1'
  };

  private users$ = new BehaviorSubject<User[]>([]);
  private loans$ = new BehaviorSubject<Loan[]>([]);
  private payments$ = new BehaviorSubject<Payment[]>([]);
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private admin$ = new BehaviorSubject<AdminConfig>(INITIAL_ADMIN);

  constructor() {
    this.initData();
  }

  private async initData(): Promise<void> {
    try {
      const isInitialized = localStorage.getItem(this.KEYS.INITIALIZED);

      if (!isInitialized) {
        // First try loading from JSON assets; fallback to seed constants if fetch fails
        await this.loadInitialFromAssetsOrSeed();
        localStorage.setItem(this.KEYS.INITIALIZED, 'true');
      } else {
        // Load existing localStorage data into BehaviorSubjects
        this.loadFromLocalStorage();
      }
    } catch (e) {
      console.warn('LocalStorage init fallback to seed constants', e);
      this.populateSeedData();
    }
  }

  private async loadInitialFromAssetsOrSeed(): Promise<void> {
    let users = INITIAL_USERS;
    let loans = INITIAL_LOANS;
    let payments = INITIAL_PAYMENTS;
    let transactions = INITIAL_TRANSACTIONS;
    let notifications = INITIAL_NOTIFICATIONS;
    let admin = INITIAL_ADMIN;

    try {
      const u = await firstValueFrom(this.http.get<User[]>('assets/data/users.json'));
      if (Array.isArray(u) && u.length) users = u;
    } catch (_) {}

    try {
      const l = await firstValueFrom(this.http.get<Loan[]>('assets/data/loans.json'));
      if (Array.isArray(l) && l.length) loans = l;
    } catch (_) {}

    try {
      const p = await firstValueFrom(this.http.get<Payment[]>('assets/data/payments.json'));
      if (Array.isArray(p) && p.length) payments = p;
    } catch (_) {}

    try {
      const t = await firstValueFrom(this.http.get<Transaction[]>('assets/data/transactions.json'));
      if (Array.isArray(t) && t.length) transactions = t;
    } catch (_) {}

    try {
      const n = await firstValueFrom(this.http.get<AppNotification[]>('assets/data/notifications.json'));
      if (Array.isArray(n) && n.length) notifications = n;
    } catch (_) {}

    try {
      const a = await firstValueFrom(this.http.get<AdminConfig>('assets/data/admin.json'));
      if (a && a.email) admin = a;
    } catch (_) {}

    this.saveUsers(users);
    this.saveLoans(loans);
    this.savePayments(payments);
    this.saveTransactions(transactions);
    this.saveNotifications(notifications);
    this.saveAdmin(admin);
  }

  private populateSeedData(): void {
    this.saveUsers(INITIAL_USERS);
    this.saveLoans(INITIAL_LOANS);
    this.savePayments(INITIAL_PAYMENTS);
    this.saveTransactions(INITIAL_TRANSACTIONS);
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    this.saveAdmin(INITIAL_ADMIN);
    localStorage.setItem(this.KEYS.INITIALIZED, 'true');
  }

  private loadFromLocalStorage(): void {
    const rawUsers = localStorage.getItem(this.KEYS.USERS);
    const rawLoans = localStorage.getItem(this.KEYS.LOANS);
    const rawPayments = localStorage.getItem(this.KEYS.PAYMENTS);
    const rawTxns = localStorage.getItem(this.KEYS.TRANSACTIONS);
    const rawNotifs = localStorage.getItem(this.KEYS.NOTIFICATIONS);
    const rawAdmin = localStorage.getItem(this.KEYS.ADMIN);

    this.users$.next(rawUsers ? JSON.parse(rawUsers) : INITIAL_USERS);
    this.loans$.next(rawLoans ? JSON.parse(rawLoans) : INITIAL_LOANS);
    this.payments$.next(rawPayments ? JSON.parse(rawPayments) : INITIAL_PAYMENTS);
    this.transactions$.next(rawTxns ? JSON.parse(rawTxns) : INITIAL_TRANSACTIONS);
    this.notifications$.next(rawNotifs ? JSON.parse(rawNotifs) : INITIAL_NOTIFICATIONS);
    this.admin$.next(rawAdmin ? JSON.parse(rawAdmin) : INITIAL_ADMIN);
  }

  // --- Users ---
  getUsers$(): Observable<User[]> {
    return this.users$.asObservable();
  }

  getUsers(): User[] {
    const data = localStorage.getItem(this.KEYS.USERS);
    return data ? JSON.parse(data) : this.users$.value;
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    this.users$.next(users);
  }

  // --- Loans ---
  getLoans$(): Observable<Loan[]> {
    return this.loans$.asObservable();
  }

  getLoans(): Loan[] {
    const data = localStorage.getItem(this.KEYS.LOANS);
    return data ? JSON.parse(data) : this.loans$.value;
  }

  saveLoans(loans: Loan[]): void {
    localStorage.setItem(this.KEYS.LOANS, JSON.stringify(loans));
    this.loans$.next(loans);
  }

  // --- Payments ---
  getPayments$(): Observable<Payment[]> {
    return this.payments$.asObservable();
  }

  getPayments(): Payment[] {
    const data = localStorage.getItem(this.KEYS.PAYMENTS);
    return data ? JSON.parse(data) : this.payments$.value;
  }

  savePayments(payments: Payment[]): void {
    localStorage.setItem(this.KEYS.PAYMENTS, JSON.stringify(payments));
    this.payments$.next(payments);
  }

  // --- Transactions ---
  getTransactions$(): Observable<Transaction[]> {
    return this.transactions$.asObservable();
  }

  getTransactions(): Transaction[] {
    const data = localStorage.getItem(this.KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : this.transactions$.value;
  }

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.transactions$.next(transactions);
  }

  // --- Notifications ---
  getNotifications$(): Observable<AppNotification[]> {
    return this.notifications$.asObservable();
  }

  getNotifications(): AppNotification[] {
    const data = localStorage.getItem(this.KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : this.notifications$.value;
  }

  saveNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notifications$.next(notifications);
  }

  // --- Admin ---
  getAdmin(): AdminConfig {
    const data = localStorage.getItem(this.KEYS.ADMIN);
    return data ? JSON.parse(data) : this.admin$.value;
  }

  saveAdmin(admin: AdminConfig): void {
    localStorage.setItem(this.KEYS.ADMIN, JSON.stringify(admin));
    this.admin$.next(admin);
  }

  // Reset helper
  resetAllData(): void {
    localStorage.clear();
    this.populateSeedData();
  }
}
