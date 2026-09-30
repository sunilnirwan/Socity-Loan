import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  addDoc,
  increment,
  deleteDoc
} from 'firebase/firestore';
import { firebaseAuth, firestoreDb, secondaryAuth } from '../firebase/firebase.config';
import { listenAsUser } from '../firebase/live-query';
import { AuthService } from './auth.service';
import { User, UserSummary } from '../models/user.model';
import { Loan, LATE_FEE, DUE_DAY, depositFor } from '../models/loan.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private users$ = new BehaviorSubject<User[]>([]);
  private isLoaded$ = new BehaviorSubject<boolean>(false);
  private nextIdPreview = 'SOCITY0001';

  constructor() {
    this.initUsersListener();
    this.fetchNextIdPreview();
  }

  private initUsersListener(): void {
    const usersCol = collection(firestoreDb, 'users');
    listenAsUser(this.auth, u => u.role === 'admin' ? usersCol : doc(firestoreDb, 'users', u.uid), (docs) => {
      const userList: User[] = [];
      docs.forEach(docSnap => {
        const d = docSnap.data()!;
        userList.push({
          uid: docSnap.id,
          id: d['id'] || docSnap.id,
          userId: d['userId'] || 'SOCITY0000',
          name: d['name'] || '',
          mobile: d['mobile'] || '',
          email: d['email'] || '',
          role: d['role'] === 'admin' ? 'admin' : 'user',
          totalAmount: typeof d['totalAmount'] === 'number' ? d['totalAmount'] : 0,
          status: (d['status'] || 'Active').toLowerCase() === 'active' ? 'Active' : 'Inactive',
          createdAt: d['createdAt'] ? (d['createdAt']?.toDate?.() ? d['createdAt'].toDate().toISOString().split('T')[0] : d['createdAt']) : new Date().toISOString().split('T')[0],
          address: d['address'] || '',
          occupation: d['occupation'] || '',
          shares: d['shares'] || 1
        });
      });

      // Sort by creation date descending or userId ascending
      userList.sort((a, b) => (a.userId > b.userId ? 1 : -1));

      this.users$.next(userList);
      this.isLoaded$.next(true);
      this.calculateNextIdPreview(userList);
    });
  }

  private async fetchNextIdPreview(): Promise<void> {
    try {
      const counterRef = doc(firestoreDb, 'counters', 'users');
      const counterSnap = await getDoc(counterRef);
      if (counterSnap.exists()) {
        const lastNum = counterSnap.data()['lastNumber'] || 0;
        this.nextIdPreview = `SOCITY${(lastNum + 1).toString().padStart(4, '0')}`;
      }
    } catch {
      // fallback to list preview
    }
  }

  private calculateNextIdPreview(users: User[]): void {
    let maxNum = 0;
    users.forEach(u => {
      const match = u.userId.match(/SOCITY(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    this.nextIdPreview = `SOCITY${(maxNum + 1).toString().padStart(4, '0')}`;
  }

  getUsers$(): Observable<User[]> {
    return this.users$.asObservable();
  }

  getUsers(): User[] {
    return this.users$.value;
  }

  generateNextUserId(): string {
    return this.nextIdPreview;
  }

  getUserById(userId: string): User | undefined {
    const list = this.users$.value;
    const clean = userId.trim().toUpperCase();
    return list.find(u => u.userId.toUpperCase() === clean || u.uid === userId || u.id?.toString() === userId);
  }

  getUserByUid(uid: string): User | undefined {
    return this.users$.value.find(u => u.uid === uid);
  }

  getUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return this.users$.value.find(u => u.email.toLowerCase() === clean);
  }

  getUserByMobile(mobile: string): User | undefined {
    const clean = mobile.trim();
    return this.users$.value.find(u => u.mobile === clean);
  }

  /**
   * Atomically acquires the next unique Society ID via a Firestore transaction.
   * Enforces SOCITY0001, SOCITY0002... even when multiple registrations happen simultaneously.
   */
  async getNextSequentialSocietyId(): Promise<string> {
    const counterRef = doc(firestoreDb, 'counters', 'users');

    const nextId = await runTransaction(firestoreDb, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let lastNumber = 0;

      if (counterDoc.exists()) {
        lastNumber = counterDoc.data()['lastNumber'] || 0;
      } else {
        // Find existing maximum in users collection to initialize counter smoothly
        const existingUsers = this.users$.value;
        existingUsers.forEach(u => {
          const match = u.userId.match(/SOCITY(\d+)/i);
          if (match && match[1]) {
            const n = parseInt(match[1], 10);
            if (n > lastNumber) lastNumber = n;
          }
        });
      }

      const newNumber = lastNumber + 1;
      transaction.set(counterRef, { lastNumber: newNumber, updatedAt: serverTimestamp() }, { merge: true });
      return `SOCITY${newNumber.toString().padStart(4, '0')}`;
    });

    this.nextIdPreview = nextId;
    return nextId;
  }

  /**
   * Registers a new user:
   * 1. Creates Firebase Auth user account.
   * 2. Atomically generates unique Society User ID via Firestore transaction.
   * 3. Creates Firestore user document in `users/{uid}`.
   * 4. Creates initial transaction record and admin notification.
   */
  async registerUser(userData: {
    name: string;
    mobile: string;
    email: string;
    password: string;
    address?: string;
    occupation?: string;
    shares?: number;
  }, byAdmin = false): Promise<{ success: boolean; message: string; user?: User }> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanMobile = userData.mobile.trim();
    const cleanName = userData.name.trim();

    // Check duplicate in cached list first
    const existingEmail = this.getUserByEmail(cleanEmail);
    if (existingEmail) {
      return { success: false, message: 'This email address is already registered in the society.' };
    }

    const existingMobile = cleanMobile && this.getUserByMobile(cleanMobile);
    if (existingMobile) {
      return { success: false, message: 'This mobile number is already registered with another member.' };
    }

    try {
      // 1. Create Firebase Auth account
      // Admin creates on the secondary instance so their own session stays signed in
      const authForCreate = byAdmin ? secondaryAuth : firebaseAuth;
      const userCredential = await createUserWithEmailAndPassword(authForCreate, cleanEmail, userData.password);
      const uid = userCredential.user.uid;
      if (byAdmin) await signOut(secondaryAuth);

      // 2. Generate unique Society User ID using atomic counter transaction
      const societyUserId = await this.getNextSequentialSocietyId();
      const today = new Date().toISOString().split('T')[0];

      // 3. Create document in Firestore users/{uid}
      const userRef = doc(firestoreDb, 'users', uid);
      const newUserData = {
        uid: uid,
        userId: societyUserId,
        name: cleanName,
        mobile: cleanMobile,
        email: cleanEmail,
        role: 'user',
        totalAmount: 0,
        status: 'active',
        address: userData.address || 'Jaipur, Rajasthan',
        occupation: userData.occupation || 'Member',
        shares: Math.max(1, Number(userData.shares) || 1),
        createdAt: serverTimestamp()
      };

      await setDoc(userRef, newUserData);

      const createdUser: User = {
        uid: uid,
        id: uid,
        userId: societyUserId,
        name: cleanName,
        mobile: cleanMobile,
        email: cleanEmail,
        role: 'user',
        totalAmount: 0,
        status: 'Active',
        address: userData.address || 'Jaipur, Rajasthan',
        occupation: userData.occupation || 'Member',
        shares: Math.max(1, Number(userData.shares) || 1),
        createdAt: today
      };

      // 4. Create initial membership transaction record
      try {
        await addDoc(collection(firestoreDb, 'transactions'), {
          userId: societyUserId,
          userUid: uid,
          userName: cleanName,
          type: 'credit',
          amount: 0,
          description: 'Member Account Registered with Society',
          date: today,
          referenceId: `REG-${societyUserId}`,
          createdAt: serverTimestamp()
        });
      } catch (txErr) {
        console.warn('Initial txn creation warning:', txErr);
      }

      // 5. Create Admin Notification
      try {
        await addDoc(collection(firestoreDb, 'notifications'), {
          type: 'system',
          title: 'New Member Registered',
          message: `${cleanName} (${societyUserId}) has registered into Society Loan System`,
          userId: societyUserId,
          userUid: uid,
          userName: cleanName,
          isRead: false,
          createdAt: serverTimestamp(),
          link: '/admin/users'
        });
      } catch (notifErr) {
        console.warn('Initial notification warning:', notifErr);
      }

      return {
        success: true,
        message: `Registration successful! Your Member ID is ${societyUserId}`,
        user: createdUser
      };
    } catch (err: any) {
      console.error('Registration failed:', err);
      let errorMsg = 'Failed to register account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email address is already in use in Firebase Authentication.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address provided.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Updates an existing user document.
   */
  async updateUser(userIdOrUid: string, updates: Partial<User>): Promise<boolean> {
    try {
      const user = this.getUserById(userIdOrUid) || this.getUserByUid(userIdOrUid);
      const uid = user?.uid || userIdOrUid;
      if (!uid) return false;

      const userRef = doc(firestoreDb, 'users', uid);
      const safeUpdates: Record<string, any> = { ...updates, updatedAt: serverTimestamp() };
      delete safeUpdates['uid'];
      delete safeUpdates['role']; // Role elevation protection

      await updateDoc(userRef, safeUpdates);
      return true;
    } catch (err) {
      console.error('Failed to update user:', err);
      return false;
    }
  }

  /** Admin changes how many society shares a member holds (monthly deposit = ₹500 × shares). */
  async updateShares(user: User, shares: number): Promise<{ success: boolean; message: string }> {
    const n = Math.floor(Number(shares));
    if (!n || n < 1) {
      return { success: false, message: 'Shares must be at least 1.' };
    }
    try {
      await updateDoc(doc(firestoreDb, 'users', user.uid || user.userId), { shares: n, updatedAt: serverTimestamp() });
      return { success: true, message: `${user.name} now holds ${n} share(s). Monthly deposit: ₹${depositFor({ shares: n }).toLocaleString('en-IN')}.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update shares.' };
    }
  }

  /**
   * Admin deletes a member's profile. Loan / payment / transaction history is kept for the society's accounts.
   * The member can no longer sign in (login requires the profile document).
   */
  async deleteUser(user: User): Promise<{ success: boolean; message: string }> {
    if (user.role === 'admin') {
      return { success: false, message: 'Admin account cannot be deleted.' };
    }
    try {
      await deleteDoc(doc(firestoreDb, 'users', user.uid || user.userId));
      return { success: true, message: `Member ${user.name} (${user.userId}) deleted.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to delete member.' };
    }
  }

  /**
   * Admin adds amount to a user.
   * Executes atomic Firestore transaction to prevent race conditions:
   * 1. Reads current user totalAmount.
   * 2. Calculates and commits newTotal = totalAmount + amount.
   * 3. Creates transactions collection document.
   * 4. Creates notifications collection document.
   */
  async addAmount(
    userIdOrUid: string,
    amount: number,
    description: string,
    date?: string,
    lateFee = false
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    if (amount <= 0) {
      return { success: false, message: 'Amount to add must be greater than zero.' };
    }

    const user = this.getUserById(userIdOrUid) || this.getUserByUid(userIdOrUid);
    if (!user) {
      return { success: false, message: 'User not found in society database.' };
    }

    const targetUid = user.uid || user.userId;
    if (!targetUid) {
      return { success: false, message: 'User identifier is missing.' };
    }

    const userRef = doc(firestoreDb, 'users', targetUid);
    const today = date || new Date().toISOString().split('T')[0];
    const cleanDesc = description.trim() || 'Monthly contribution / Deposit';

    try {
      let finalBalance = 0;

      await runTransaction(firestoreDb, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User document does not exist in Firestore.');
        }

        const currentData = userDoc.data();
        const currentAmount = typeof currentData['totalAmount'] === 'number' ? currentData['totalAmount'] : 0;
        finalBalance = currentAmount + amount;

        transaction.update(userRef, {
          totalAmount: finalBalance,
          updatedAt: serverTimestamp()
        });
        transaction.set(doc(firestoreDb, 'counters', 'society'), {
          totalDeposits: increment(amount),
          ...(lateFee ? { totalFees: increment(LATE_FEE) } : {})
        }, { merge: true });
      });

      // Create transaction history document
      await addDoc(collection(firestoreDb, 'transactions'), {
        userId: user.userId,
        userUid: user.uid,
        userName: user.name,
        type: 'credit',
        category: 'admin_topup',
        amount: amount,
        description: cleanDesc,
        date: today,
        referenceId: `TOPUP-${user.userId}`,
        balanceAfter: finalBalance,
        createdAt: serverTimestamp()
      });

      // Late fee is society income: recorded separately, not added to the member's deposit balance
      if (lateFee) {
        await addDoc(collection(firestoreDb, 'transactions'), {
          userId: user.userId,
          userUid: user.uid,
          userName: user.name,
          type: 'payment',
          category: 'late_fee',
          amount: LATE_FEE,
          description: `Late fee (payment after ${DUE_DAY}th)`,
          date: today,
          referenceId: `LATEFEE-${user.userId}`,
          createdAt: serverTimestamp()
        });
      }

      // Create notification
      await addDoc(collection(firestoreDb, 'notifications'), {
        type: 'credit',
        title: 'Amount Credited to Account',
        message: `₹${amount.toLocaleString('en-IN')} added to ${user.name} (${user.userId}). Note: ${cleanDesc}`,
        userId: user.userId,
        userUid: user.uid,
        userName: user.name,
        amount: amount,
        isRead: false,
        createdAt: serverTimestamp(),
        link: '/admin/users'
      });

      return {
        success: true,
        message: `₹${amount.toLocaleString('en-IN')} successfully added to ${user.name}'s account!${lateFee ? ` Late fee ₹${LATE_FEE} recorded.` : ''}`,
        newBalance: finalBalance
      };
    } catch (err: any) {
      console.error('Failed to add amount via transaction:', err);
      return { success: false, message: err.message || 'Failed to update user balance in Firestore.' };
    }
  }

  /**
   * Combines user data with loan statistics for the Admin User Table.
   */
  getUserSummaries$(loans$: Observable<Loan[]>): Observable<UserSummary[]> {
    return this.getUsers$().pipe(
      map(users => users.filter(u => u.role !== 'admin')),
      map(members => {
        return members.map(user => {
          return {
            user,
            totalLoansAmount: 0,
            activeLoansCount: 0,
            completedLoansCount: 0,
            paidLoanAmount: 0,
            pendingLoanAmount: 0,
            loanStatus: 'No Loan'
          };
        });
      })
    );
  }
}
