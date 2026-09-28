import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private storage = inject(LocalStorageService);

  getNotifications$(): Observable<AppNotification[]> {
    return this.storage.getNotifications$();
  }

  getNotifications(): AppNotification[] {
    return this.storage.getNotifications();
  }

  getUnreadCount$(): Observable<number> {
    return this.storage.getNotifications$().pipe(
      map(notifs => notifs.filter(n => !n.isRead).length)
    );
  }

  markAsRead(notificationId: number): void {
    const notifs = this.storage.getNotifications();
    const index = notifs.findIndex(n => n.id === notificationId);
    if (index !== -1 && !notifs[index].isRead) {
      notifs[index].isRead = true;
      this.storage.saveNotifications(notifs);
    }
  }

  markAllAsRead(): void {
    const notifs = this.storage.getNotifications();
    const updated = notifs.map(n => ({ ...n, isRead: true }));
    this.storage.saveNotifications(updated);
  }

  createNotification(notifData: Omit<AppNotification, 'id'>): AppNotification {
    const notifs = this.storage.getNotifications();
    const nextId = notifs.length > 0 ? Math.max(...notifs.map(n => n.id || 0)) + 1 : 1;

    const newNotif: AppNotification = {
      ...notifData,
      id: nextId
    };

    this.storage.saveNotifications([newNotif, ...notifs]);
    return newNotif;
  }

  deleteNotification(notificationId: number): void {
    const notifs = this.storage.getNotifications();
    this.storage.saveNotifications(notifs.filter(n => n.id !== notificationId));
  }
}
