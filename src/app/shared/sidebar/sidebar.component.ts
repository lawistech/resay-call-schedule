// src/app/shared/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ReminderService } from '../../core/services/reminder.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  animations: [
    trigger('submenuAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  expanded = true;
  tempExpanded = false;
  expandedSection: string | null = null;
  routeSubscription: Subscription | null = null;
  upcomingCallsCount = 0;
  // Controls hover expand functionality - can be set via settings
  hoverMode = true;
  expandTimer: any = null;
  collapseTimer: any = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    private reminderService: ReminderService
  ) {}

  ngOnInit(): void {
    this.loadSidebarState();
    this.setupRouteListener();
    
    // Get upcoming calls count
    this.refreshCallsCount();
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    
    this.clearTimers();
  }

  // Clear all timers to prevent memory leaks
  private clearTimers(): void {
    if (this.expandTimer) {
      clearTimeout(this.expandTimer);
      this.expandTimer = null;
    }
    
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
  }

  // Handles route changes to highlight correct sections
  private setupRouteListener(): void {
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentRoute = event.url;
        this.setActiveSection(currentRoute);
      });
  }

  private setActiveSection(route: string): void {
    if (route.includes('/call') || route.includes('/schedule')) {
      this.expandedSection = 'calls';
    } else if (route.includes('/leads') || route.includes('/opportunities') || route.includes('/pipeline')) {
      this.expandedSection = 'sales';
    } else if (route.includes('/contacts') || route.includes('/accounts')) {
      this.expandedSection = 'contacts';
    } else if (route.includes('/products') || route.includes('/orders') || route.includes('/inventory') || route.includes('/ecommerce')) {
      this.expandedSection = 'ecommerce';
    } else if (route.includes('/reports') || route.includes('/analytics')) {
      this.expandedSection = 'analytics';
    }
  }

  // Toggle sidebar expanded/collapsed state
  toggleSidebar(): void {
    this.expanded = !this.expanded;
    
    // Reset temp expanded state when manually toggling
    if (this.expanded) {
      this.tempExpanded = false;
    }
    
    localStorage.setItem('sidebarExpanded', this.expanded.toString());
  }

  // Toggle section expansion
  toggleSection(section: string): void {
    this.expandedSection = (this.expandedSection === section) ? null : section;
    localStorage.setItem('expandedSection', this.expandedSection || '');
  }
  
  // Load sidebar state from localStorage
  private loadSidebarState(): void {
    const savedExpanded = localStorage.getItem('sidebarExpanded');
    if (savedExpanded !== null) {
      this.expanded = savedExpanded === 'true';
    }
    
    const savedSection = localStorage.getItem('expandedSection');
    if (savedSection) {
      this.expandedSection = savedSection;
    }
  }
  
  // Fetch the user's first initial for the avatar
  get userInitial(): string {
    const user = this.authService.getCurrentUser();
    return user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  }
  
  // Temporarily expand the sidebar on hover
  temporarilyExpand(): void {
    // Clear any existing timers first
    this.clearTimers();
    
    if (this.hoverMode && !this.expanded) {
      // Set a small delay before expanding to prevent unwanted expansions
      this.expandTimer = setTimeout(() => {
        this.tempExpanded = true;
      }, 200);
    }
  }
  
  // Collapse when mouse leaves
  collapseTemporary(): void {
    // Clear any existing timers first
    this.clearTimers();
    
    if (this.hoverMode && !this.expanded) {
      // Set a small delay before collapsing to prevent flickering
      this.collapseTimer = setTimeout(() => {
        this.tempExpanded = false;
      }, 300);
    }
  }
  
  // Fetch upcoming calls count
  private refreshCallsCount(): void {
    // This is just a placeholder for demonstration
    this.upcomingCallsCount = 3;
  }
  
  // Logout handler
  logout(): void {
    this.authService.signOut();
  }
}