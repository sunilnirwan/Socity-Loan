import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from './toast.service';
import { User, UserSummary } from '../models/user.model';
import { Transaction } from '../models/transaction.model';
import { AppNotification } from '../models/notification.model';
import { Loan } from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private storage = inject(LocalStorageService);
  private toast = inject(ToastService);

  getUsers$(): Observable<User[]> {
    return this.storage.getUsers$();
  }

  getUsers(): User[] {
    return this.storage.getUsers();
  }

  getUserById(userId: string): User | undefined {
    const users = this.storage.getUsers();
    return users.find(u => u.userId.toUpperCase() === userId.toUpperCase() || u.id?.toString() === userId);
  }

  getUserByEmail(email: string): User | undefined {
    const users = this.storage.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByMobile(mobile: string): User | undefined {
    const users = this.storage.getUsers();
    return users.find(u => u.mobile === mobile);
  }

  generateNextUserId(): string {
    const users = this.storage.getUsers();
    if (users.length === 0) {
      return 'SOCITY0001';
    }

    let maxNum = 0;
    users.forEach(u => {
      const match = u.userId.match(/SOCITY(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    return `SOCITY${nextNum.toString().padStart(4, '0')}`;
  }

  registerUser(userData: {
    name: string;
    mobile: string;
    email: string;
    password: string;
    address?: string;
    occupation?: string;
  }): { success: boolean; message: string; user?: User } {
    const users = this.storage.getUsers();

    // Check duplicate email
    const emailExists = users.some(u => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (emailExists) {
      return { success: false, message: 'This email address is already registered.' };
    }

    // Check duplicate mobile
    const mobileExists = users.some(u => u.mobile === userData.mobile.trim());
    if (mobileExists) {
      return { success: false, message: 'This mobile number is already registered.' };
    }

    const nextId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
    const userId = this.generateNextUserId();
    const today = new Date().toISOString().split('T')[0];

    const newUser: User = {
      id: nextId,
      userId: userId,
      name: userData.name.trim(),
      mobile: userData.mobile.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      totalAmount: 0,
      createdAt: today,
      status: 'Active',
      address: userData.address || 'Jaipur, Rajasthan',
      occupation: userData.occupation || 'Member'
    };

    const updatedUsers = [...users, newUser];
    this.storage.saveUsers(updatedUsers);

    // Create a transaction record for membership registration
    const txns = this.storage.getTransactions();
    const nextTxnId = txns.length > 0 ? Math.max(...txns.map(t => t.id || 0)) + 1 : 1;
    const newTxn: Transaction = {
      id: nextTxnId,
      transactionId: `TXN${nextTxnId.toString().padStart(4, '0')}`,
      userId: newUser.userId,
      userName: newUser.name,
      type: 'credit',
      category: 'contribution',
      amount: 0,
      description: 'Account Created & Registered with Society',
      date: today,
      referenceId: `REG-${newUser.userId}`,
      balanceAfter: 0
    };
    this.storage.saveTransactions([newTxn, ...txns]);

    // Create an admin notification for new user registration
    const notifs = this.storage.getNotifications();
    const nextNotifId = notifs.length > 0 ? Math.max(...notifs.map(n => n.id || 0)) + 1 : 1;
    const newNotif: AppNotification = {
      id: nextNotifId,
      type: 'system',
      title: 'New Member Registered',
      message: `${newUser.name} (${newUser.userId}) has registered into Society Loan System`,
      userId: newUser.userId,
      userName: newUser.name,
      isRead: false,
      createdAt: today,
      link: `/admin/users`
    };
    this.storage.saveNotifications([newNotif, ...notifs]);

    return { success: true, message: 'Registration successful!', user: newUser };
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const users = this.storage.getUsers();
    const index = users.findIndex(u => u.userId.toUpperCase() === userId.toUpperCase());
    if (index === -1) return false;

    users[index] = { ...users[index], ...updates };
    this.storage.saveUsers(users);
    return true;
  }

  addAmount(
    userId: string,
    amount: number,
    description: string,
    date?: string
  ): { success: boolean; message: string; newBalance?: number } {
    if (amount <= 0) {
      return { success: false, message: 'Amount to add must be greater than zero.' };
    }

    const users = this.storage.getUsers();
    const userIndex = users.findIndex(u => u.userId.toUpperCase() === userId.toUpperCase());

    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }

    const user = users[userIndex];
    const prevAmount = user.totalAmount || 0;
    const newTotal = prevAmount + amount;
    const txnDate = date || new Date().toISOString().split('T')[0];

    // Update user balance
    users[userIndex] = {
      ...user,
      totalAmount: newTotal
    };
    this.storage.saveUsers(users);

    // Create transaction record
    const txns = this.storage.getTransactions();
    const nextTxnId = txns.length > 0 ? Math.max(...txns.map(t => t.id || 0)) + 1 : 1;
    const newTxn: Transaction = {
      id: nextTxnId,
      transactionId: `TXN${nextTxnId.toString().padStart(4, '0')}`,
      userId: user.userId,
      userName: user.name,
      type: 'credit',
      category: 'admin_topup',
      amount: amount,
      description: description || 'Admin Balance Top-up / Contribution',
      date: txnDate,
      referenceId: `TOPUP-${user.userId}`,
      balanceAfter: newTotal
    };
    this.storage.saveTransactions([newTxn, ...txns]);

    // Create notification
    const notifs = this.storage.getNotifications();
    const nextNotifId = notifs.length > 0 ? Math.max(...notifs.map(n => n.id || 0)) + 1 : 1;
    const newNotif: AppNotification = {
      id: nextNotifId,
      type: 'admin_credit',
      title: 'Amount Credited to Account',
      message: `₹${amount.toLocaleString('en-IN')} added to ${user.name} (${user.userId}). Reason: ${description}`,
      userId: user.userId,
      userName: user.name,
      amount: amount,
      isRead: false,
      createdAt: txnDate,
      link: `/admin/users`
    };
    this.storage.saveNotifications([newNotif, ...notifs]);

    return {
      success: true,
      message: `₹${amount.toLocaleString('en-IN')} added successfully to ${user.name}'s account!`,
      newBalance: newTotal
    };
  }

  getUserSummaries$(): Observable<UserSummary[]> {
    return this.storage.getUsers$().pipe(
      map(users => {
        const loans = this.storage.getLoans();
        return users.map(user => {
          const userLoans = loans.filter(l => l.userId.toUpperCase() === user.userId.toUpperCase());
          const totalLoansAmount = userLoans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
          const paidLoanAmount = userLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
          const pendingLoanAmount = userLoans.reduce((sum, l) => sum + (l.pendingAmount || 0), 0);
          const activeLoans = userLoans.filter(l => l.status === 'Active');
          const completedLoans = userLoans.filter(l => l.status === 'Completed');

          let loanStatus: 'No Loan' | 'Loan Active' | 'Loan Completed' = 'No Loan';
          if (activeLoans.length > 0) {
            loanStatus = 'Loan Active';
          } else if (completedLoans.length > 0) {
            loanStatus = 'Loan Completed';
          }

          return {
            user,
            totalLoansAmount,
            activeLoansCount: activeLoans.length,
            completedLoansCount: completedLoans.length,
            paidLoanAmount,
            pendingLoanAmount,
            loanStatus
          };
        });
      })
    );
  }
}
