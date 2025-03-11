// src/app/shared/notification-display/notification-display.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <div *ngFor="let notification of notifications" 
          [ngClass]="{
            'bg-green-100 border-green-500 text-green-700': notification.type === 'success',
            'bg-red-100 border-red-500 text-red-700': notification.type === 'error',
            'bg-blue-100 border-blue-500 text-blue-700': notification.type === 'info',
            'bg-yellow-100 border-yellow-500 text-yellow-700': notification.type === 'warning',
            'bg-indigo-100 border-indigo-500 text-indigo-700': notification.type === 'reminder'
          }"
          class="border-l-4 p-4 rounded shadow-md flex justify-between items-start transition-all duration-500 ease-in-out">
        <div>
          <div class="font-bold" *ngIf="notification.type === 'reminder'">Call Reminder</div>
          <p>{{ notification.message }}</p>
        </div>
        <button (click)="dismissNotification(notification.id)" class="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `
})
export class NotificationDisplayComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  dismissNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }
}