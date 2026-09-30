import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import {
  collection,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { firestoreDb } from '../firebase/firebase.config';
import { listenAsUser } from '../firebase/live-query';
import { AuthService } from './auth.service';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private auth = inject(AuthService);
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private isLoaded$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initNotificationsListener();
  }

  private initNotificationsListener(): void {
    const notifsCol = collection(firestoreDb, 'notifications');
    listenAsUser(this.auth, u => u.role === 'admin' ? notifsCol : query(notifsCol, where('userUid', '==', u.uid)), (docs) => {
      const list: AppNotification[] = [];
      docs.forEach(docSnap => {
        const d = docSnap.data()!;
        list.push({
          id: docSnap.id,
          type: d['type'] || 'system',
          title: d['title'] || '',
          message: d['message'] || '',
          userId: d['userId'] || '',
          userUid: d['userUid'] || '',
          userName: d['userName'] || '',
          loanId: d['loanId'] || '',
          amount: d['amount'],
          isRead: !!d['isRead'],
          createdAt: d['createdAt']?.toDate?.() ? d['createdAt'].toDate().toISOString().split('T')[0] : (d['createdAt'] || new Date().toISOString().split('T')[0]),
          link: d['link'] || '',
          paymentDocId: d['paymentDocId'] || ''
        });
      });

      // Sort newest first
      list.sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });

      this.notifications$.next(list);
      this.isLoaded$.next(true);
    });
  }

  getNotifications$(): Observable<AppNotification[]> {
    return this.notifications$.asObservable();
  }

  getNotifications(): AppNotification[] {
    return this.notifications$.value;
  }

  getUnreadCount$(): Observable<number> {
    return this.notifications$.pipe(
      map(notifs => notifs.filter(n => !n.isRead).length)
    );
  }

  async markAsRead(notificationId: string | number): Promise<void> {
    const idStr = notificationId.toString();
    try {
      const notifRef = doc(firestoreDb, 'notifications', idStr);
      await updateDoc(notifRef, {
        isRead: true,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Failed to mark notification as read in Firestore:', err);
      // Local fallback
      const current = this.notifications$.value;
      const target = current.find(n => n.id?.toString() === idStr);
      if (target) target.isRead = true;
      this.notifications$.next([...current]);
    }
  }

  async markAllAsRead(): Promise<void> {
    const unread = this.notifications$.value.filter(n => !n.isRead);
    for (const notif of unread) {
      if (notif.id) {
        try {
          const notifRef = doc(firestoreDb, 'notifications', notif.id.toString());
          await updateDoc(notifRef, { isRead: true });
        } catch {
          // ignore individual failures
        }
      }
    }
    const current = this.notifications$.value.map(n => ({ ...n, isRead: true }));
    this.notifications$.next(current);
  }

  async createNotification(notifData: Omit<AppNotification, 'id'>): Promise<AppNotification> {
    const today = notifData.createdAt || new Date().toISOString().split('T')[0];
    const docRef = await addDoc(collection(firestoreDb, 'notifications'), {
      ...notifData,
      createdAt: serverTimestamp()
    });

    return {
      ...notifData,
      id: docRef.id,
      createdAt: today
    };
  }

  async deleteNotification(notificationId: string | number): Promise<void> {
    try {
      const notifRef = doc(firestoreDb, 'notifications', notificationId.toString());
      await deleteDoc(notifRef);
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  }
}
