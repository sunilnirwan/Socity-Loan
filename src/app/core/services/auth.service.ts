import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { firebaseAuth, firestoreDb } from '../firebase/firebase.config';
import { ToastService } from './toast.service';

export interface LoggedInUser {
  uid: string;
  userId: string;
  name: string;
  email: string;
  mobile?: string;
  totalAmount?: number;
  role: 'admin' | 'user';
  status?: string;
  createdAt?: any;
  address?: string;
  occupation?: string;
  shares?: number;
  id?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private toast = inject(ToastService);

  private readonly USER_STORAGE_KEY = 'society_cached_user';
  private readonly ROLE_STORAGE_KEY = 'society_cached_role';

  private currentUser$ = new BehaviorSubject<LoggedInUser | null>(this.getCachedUser());
  private userRole$ = new BehaviorSubject<'admin' | 'user' | null>(this.getCachedRole());
  private isAuthReady$ = new BehaviorSubject<boolean>(false);
  private userDocUnsubscribe: Unsubscribe | null = null;

  constructor() {
    this.initAuthListener();
  }

  private getCachedUser(): LoggedInUser | null {
    try {
      const raw = localStorage.getItem(this.USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getCachedRole(): 'admin' | 'user' | null {
    try {
      const r = localStorage.getItem(this.ROLE_STORAGE_KEY);
      return r === 'admin' || r === 'user' ? r : null;
    } catch {
      return null;
    }
  }

  private setCachedUser(user: LoggedInUser | null, role: 'admin' | 'user' | null): void {
    if (user && role) {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(this.ROLE_STORAGE_KEY, role);
    } else {
      localStorage.removeItem(this.USER_STORAGE_KEY);
      localStorage.removeItem(this.ROLE_STORAGE_KEY);
    }
  }

  private initAuthListener(): void {
    onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
      if (this.userDocUnsubscribe) {
        this.userDocUnsubscribe();
        this.userDocUnsubscribe = null;
      }

      if (!fbUser) {
        this.currentUser$.next(null);
        this.userRole$.next(null);
        this.setCachedUser(null, null);
        this.isAuthReady$.next(true);
        return;
      }

      try {
        const userRef = doc(firestoreDb, 'users', fbUser.uid);

        // Set up real-time listener on user doc
        this.userDocUnsubscribe = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const role: 'admin' | 'user' = data['role'] === 'admin' ? 'admin' : 'user';
            const loggedIn: LoggedInUser = {
              uid: fbUser.uid,
              userId: data['userId'] || (role === 'admin' ? 'ADMIN001' : 'SOCITY0001'),
              name: data['name'] || fbUser.displayName || (role === 'admin' ? 'Sunil Nirwan' : 'Member'),
              email: fbUser.email || data['email'] || '',
              mobile: data['mobile'] || '',
              totalAmount: typeof data['totalAmount'] === 'number' ? data['totalAmount'] : 0,
              role: role,
              status: data['status'] || 'active',
              createdAt: data['createdAt'] || new Date().toISOString().split('T')[0],
              address: data['address'] || '',
              occupation: data['occupation'] || '',
              shares: data['shares'] || 1,
              id: data['id'] || fbUser.uid
            };

            this.currentUser$.next(loggedIn);
            this.userRole$.next(role);
            this.setCachedUser(loggedIn, role);
          } else {
            // Document doesn't exist yet in Firestore
            // If it's the specified admin account, create the admin doc in Firestore
            if (fbUser.email?.toLowerCase() === 'sunilnirwan55@gmail.com') {
              const adminData: LoggedInUser = {
                uid: fbUser.uid,
                userId: 'ADMIN001',
                name: 'Sunil Nirwan',
                email: 'sunilnirwan55@gmail.com',
                role: 'admin',
                totalAmount: 0,
                status: 'active',
                createdAt: new Date().toISOString().split('T')[0]
              };
              await setDoc(userRef, {
                ...adminData,
                createdAt: serverTimestamp()
              });
              this.currentUser$.next(adminData);
              this.userRole$.next('admin');
              this.setCachedUser(adminData, 'admin');
            }
          }
          this.isAuthReady$.next(true);
        }, (err) => {
          console.warn('User doc listener error:', err);
          this.isAuthReady$.next(true);
        });
      } catch (err) {
        console.error('Error fetching user auth doc:', err);
        this.isAuthReady$.next(true);
      }
    });
  }

  getCurrentUser$(): Observable<LoggedInUser | null> {
    return this.currentUser$.asObservable();
  }

  getUserRole$(): Observable<'admin' | 'user' | null> {
    return this.userRole$.asObservable();
  }

  getIsAuthReady$(): Observable<boolean> {
    return this.isAuthReady$.asObservable();
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

  /**
   * Log into the application using Firebase Authentication.
   * Supports both Email and Society User ID (e.g. SOCITY0001).
   */
  async login(
    type: 'admin' | 'user',
    idOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanInput = idOrEmail.trim();

    try {
      let emailToLogin = cleanInput;

      // If user provided a Society ID like SOCITY0001 or not an email format
      if (!cleanInput.includes('@')) {
        const usersRef = collection(firestoreDb, 'users');
        const q = query(usersRef, where('userId', '==', cleanInput.toUpperCase()));
        const snap = await getDocs(q);

        if (snap.empty) {
          return {
            success: false,
            message: `No account found with Society ID: ${cleanInput.toUpperCase()}`
          };
        }

        const memberData = snap.docs[0].data();
        if (!memberData['email']) {
          return {
            success: false,
            message: 'No registered email found for this User ID.'
          };
        }
        emailToLogin = memberData['email'];
      }

      // Check admin email rule if admin portal
      if (type === 'admin') {
        const adminEmail = 'sunilnirwan55@gmail.com';
        if (emailToLogin.toLowerCase() !== adminEmail) {
          return {
            success: false,
            message: 'Only registered administrators can sign in through the Admin Portal.'
          };
        }
      }

      // Perform Firebase Auth Sign In
      const userCred = await signInWithEmailAndPassword(firebaseAuth, emailToLogin, password);
      const uid = userCred.user.uid;

      // Fetch Firestore user document
      const userDocRef = doc(firestoreDb, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      let role: 'admin' | 'user' = 'user';
      let userObj: LoggedInUser;

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        role = data['role'] === 'admin' ? 'admin' : 'user';

        if (type === 'admin' && role !== 'admin') {
          await signOut(firebaseAuth);
          return {
            success: false,
            message: 'Access Denied: This account does not possess administrator privileges.'
          };
        }

        userObj = {
          uid: uid,
          userId: data['userId'] || (role === 'admin' ? 'ADMIN001' : 'SOCITY0001'),
          name: data['name'] || userCred.user.displayName || (role === 'admin' ? 'Sunil Nirwan' : 'Member'),
          email: userCred.user.email || data['email'],
          mobile: data['mobile'] || '',
          totalAmount: data['totalAmount'] || 0,
          role: role,
          status: data['status'] || 'active',
          createdAt: data['createdAt'] || new Date().toISOString().split('T')[0],
          address: data['address'] || '',
          occupation: data['occupation'] || '',
          shares: data['shares'] || 1,
          id: uid
        };
      } else {
        // Special case: Admin account initialization if doc not yet created
        if (emailToLogin.toLowerCase() === 'sunilnirwan55@gmail.com') {
          role = 'admin';
          userObj = {
            uid: uid,
            userId: 'ADMIN001',
            name: 'Sunil Nirwan',
            email: 'sunilnirwan55@gmail.com',
            role: 'admin',
            totalAmount: 0,
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0]
          };
          await setDoc(userDocRef, {
            ...userObj,
            createdAt: serverTimestamp()
          });
        } else {
          await signOut(firebaseAuth);
          return {
            success: false,
            message: 'User profile record not found in society database.'
          };
        }
      }

      // Update state
      this.currentUser$.next(userObj);
      this.userRole$.next(role);
      this.setCachedUser(userObj, role);

      this.toast.success(
        `Welcome back, ${userObj.name}!`,
        role === 'admin' ? 'Admin Login Successful' : 'Login Successful'
      );

      // Navigate to respective dashboard
      if (role === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/user/dashboard']);
      }

      return { success: true, message: 'Authentication successful' };
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      const friendlyMessage = this.mapAuthError(err);
      return { success: false, message: friendlyMessage };
    }
  }

  async updateCurrentUserProfile(updated: Partial<LoggedInUser>): Promise<void> {
    const current = this.currentUser$.value;
    if (!current) return;

    try {
      const userRef = doc(firestoreDb, 'users', current.uid);
      const safeUpdates: Record<string, any> = {};

      if (updated.name) safeUpdates['name'] = updated.name.trim();
      if (updated.mobile) safeUpdates['mobile'] = updated.mobile.trim();
      if (updated.address) safeUpdates['address'] = updated.address.trim();
      if (updated.occupation) safeUpdates['occupation'] = updated.occupation.trim();
      safeUpdates['updatedAt'] = serverTimestamp();

      await updateDoc(userRef, safeUpdates);

      const merged = { ...current, ...safeUpdates };
      this.currentUser$.next(merged);
      this.setCachedUser(merged, merged.role);
      this.toast.success('Your profile has been updated.', 'Profile Updated');
    } catch (err) {
      console.error('Failed to update profile:', err);
      this.toast.error('Failed to update profile. Please try again.', 'Error');
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.userDocUnsubscribe) {
        this.userDocUnsubscribe();
        this.userDocUnsubscribe = null;
      }
      await signOut(firebaseAuth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      this.currentUser$.next(null);
      this.userRole$.next(null);
      this.setCachedUser(null, null);
      this.toast.info('You have been logged out successfully.', 'Logged Out');
      this.router.navigate(['/login']);
    }
  }

  private mapAuthError(err: AuthError | any): string {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email/User ID or password. Please verify your credentials.';
      case 'auth/invalid-email':
        return 'The provided email address format is invalid.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact the administrator.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Access temporarily blocked. Please wait and try again.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection.';
      default:
        return err?.message || 'Authentication failed. Please verify credentials and try again.';
    }
  }
}
