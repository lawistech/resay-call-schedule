// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ReminderService } from './core/services/reminder.service';
import { NotificationDisplayComponent } from './shared/notification-display/notification-display.component';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDisplayComponent]
})
export class AppComponent implements OnInit {
  showSidebar = true;
  showFullSidebar = true; // Controls expanded/collapsed state
  expandedSection: string | null = null; // Tracks which section is expanded

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
      
      // Set initial expanded section based on current route
      this.setInitialExpandedSection(currentRoute);
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
    
    // Load sidebar state from localStorage if available
    this.loadSidebarState();
  }
  
  // Add this getter method
  get userInitial(): string {
    const user = this.authService.getCurrentUser();
    return user?.email ? user.email.charAt(0).toUpperCase() : '';
  }
  
  // Toggle sidebar expanded/collapsed state
  toggleSidebar(): void {
    this.showFullSidebar = !this.showFullSidebar;
    localStorage.setItem('sidebarExpanded', this.showFullSidebar.toString());
  }
  
  // Toggle section expansion
  toggleSection(section: string): void {
    if (this.expandedSection === section) {
      this.expandedSection = null;
    } else {
      this.expandedSection = section;
    }
    localStorage.setItem('expandedSection', this.expandedSection || '');
  }
  
  // Load sidebar state from localStorage
  private loadSidebarState(): void {
    const savedExpanded = localStorage.getItem('sidebarExpanded');
    if (savedExpanded !== null) {
      this.showFullSidebar = savedExpanded === 'true';
    }
    
    const savedSection = localStorage.getItem('expandedSection');
    if (savedSection) {
      this.expandedSection = savedSection;
    }
  }
  
  // Set initial expanded section based on route
  private setInitialExpandedSection(route: string): void {
    if (route.includes('/call') || route.includes('/schedule')) {
      this.expandedSection = 'calls';
    } else if (route.includes('/leads') || route.includes('/opportunities') || route.includes('/pipeline')) {
      this.expandedSection = 'sales';
    } else if (route.includes('/contacts') || route.includes('/accounts')) {
      this.expandedSection = 'contacts';
    } else if (route.includes('/products') || route.includes('/orders') || route.includes('/inventory')) {
      this.expandedSection = 'ecommerce';
    } else if (route.includes('/reports') || route.includes('/analytics')) {
      this.expandedSection = 'analytics';
    }
  }
}