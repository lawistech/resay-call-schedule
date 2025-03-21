// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
  REMINDER = 'reminder'
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  timeout: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  constructor() {
    this.requestNotificationPermission();
  }

  // Show a success notification
  success(message: string, timeout = 5000): void {
    this.addNotification(NotificationType.SUCCESS, message, timeout);
    
    // Also log to console for development
    console.log(`Success: ${message}`);
  }

  // Show an error notification
  error(message: string, timeout = 7000): void {
    this.addNotification(NotificationType.ERROR, message, timeout);
    
    // Also log to console for development
    console.error(`Error: ${message}`);
  }

  // Show an info notification
  info(message: string, timeout = 5000): void {
    this.addNotification(NotificationType.INFO, message, timeout);
    
    // Also log to console for development
    console.info(`Info: ${message}`);
  }

  // Show a warning notification
  warning(message: string, timeout = 6000): void {
    this.addNotification(NotificationType.WARNING, message, timeout);
    
    // Also log to console for development
    console.warn(`Warning: ${message}`);
  }

  // Show a reminder notification with browser notification
  reminder(message: string, callDetails: any, timeout = 0): void {
    this.addNotification(NotificationType.REMINDER, message, timeout);
    
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
    
    // Also log to console for development
    console.info(`Reminder: ${message}`);
  }

  // Remove a notification by ID
  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  // Clear all notifications
  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  // Add a notification and handle its timeout
  private addNotification(type: NotificationType, message: string, timeout: number): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      message,
      timestamp: new Date(),
      timeout
    };
    
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Remove the notification after timeout if specified
    if (timeout > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, timeout);
    }
  }

  // Generate a unique ID for notifications
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