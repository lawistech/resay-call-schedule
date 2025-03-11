// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
  REMINDER = 'reminder'
}

export interface Notification {
  type: NotificationType;
  message: string;
  timestamp: Date;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.requestNotificationPermission();
  }

  success(message: string): void {
    this.addNotification(NotificationType.SUCCESS, message);
  }

  error(message: string): void {
    this.addNotification(NotificationType.ERROR, message);
  }

  info(message: string): void {
    this.addNotification(NotificationType.INFO, message);
  }

  warning(message: string): void {
    this.addNotification(NotificationType.WARNING, message);
  }

  reminder(message: string, callDetails: any): void {
    this.addNotification(NotificationType.REMINDER, message);
    
    // Send browser notification if permission granted
    if (Notification.permission === 'granted') {
      const notification = new Notification('Call Reminder', {
        body: message,
        icon: '/assets/icons/call-icon.png' // Add this icon to your assets folder
      });
      
      notification.onclick = () => {
        window.focus();
        // Navigate to call details or open call modal
        if (callDetails && callDetails.id) {
          // You could implement navigation logic here
        }
      };
    }
  }

  private addNotification(type: NotificationType, message: string): void {
    const notification: Notification = {
      type,
      message,
      timestamp: new Date(),
      id: this.generateId()
    };
    
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...currentNotifications, notification]);
    
    // Auto-remove notification after 5 seconds (except for errors)
    if (type !== NotificationType.ERROR) {
      setTimeout(() => this.removeNotification(notification.id), 5000);
    }
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  // Request permission for browser notifications
  requestNotificationPermission(): void {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return;
    }
    
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
}