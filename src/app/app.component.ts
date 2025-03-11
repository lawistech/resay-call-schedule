// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ReminderService } from './core/services/reminder.service';
import { NotificationDisplayComponent } from './shared/notification-display/notification-display.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDisplayComponent]
})
export class AppComponent implements OnInit {
  showSidebar = true;

  constructor(
    public authService: AuthService,
    private router: Router,
    private reminderService: ReminderService
  ) {
    // Hide sidebar on login/register pages
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      this.showSidebar = !(currentRoute.includes('/login') || currentRoute.includes('/register'));
    });
  }
  
  ngOnInit(): void {
    // Initialize call reminders when app starts
    this.reminderService.checkUpcomingCalls();
  }
  
  // Add this getter method
  get userInitial(): string {
    const user = this.authService.getCurrentUser();
    return user?.email ? user.email.charAt(0).toUpperCase() : '';
  }
}