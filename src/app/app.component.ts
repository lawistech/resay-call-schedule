// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ReminderService } from './core/services/reminder.service';
import { NotificationDisplayComponent } from './shared/notification-display/notification-display.component';
import { SupabaseService } from './core/services/supabase.service';
import { SidebarModule } from './shared/sidebar/sidebar.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NotificationDisplayComponent,
    SidebarModule
  ]
})
export class AppComponent implements OnInit {
  // Whether to show sidebar based on route (hide on login/register pages)
  showSidebar = true;

  constructor(
    public authService: AuthService,
    private router: Router,
    private reminderService: ReminderService,
    private supabaseService: SupabaseService
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
    
    // Update overdue status
    this.supabaseService.updateOverdueStatus();
    
    // Optionally set a timer to update periodically
    setInterval(() => {
      this.supabaseService.updateOverdueStatus();
    }, 3600000); // Every hour
  }
}