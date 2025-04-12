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
  // Removed upcomingCallsCount and pendingTasksCount

  // Controls hover expand functionality - can be set via settings
  hoverMode = true;
  expandTimer: any = null;
  collapseTimer: any = null;
  currentRoute = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private reminderService: ReminderService
  ) {}

  ngOnInit(): void {
    this.loadSidebarState();
    this.setupRouteListener();

    // Initialize the current route
    this.currentRoute = this.router.url;
    this.setActiveSection(this.currentRoute);
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

  // Improved route listener to better handle active sections
  private setupRouteListener(): void {
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.setActiveSection(this.currentRoute);
      });
  }

  // Improved active section detection with more precise route matching
  private setActiveSection(route: string): void {
    // Reset the expanded section first
    this.expandedSection = null;

    // Check for more specific paths first to avoid incorrect matches
    if (route.includes('/schedule') || route.includes('/call-history') ||
        route.includes('/contacts') || route.includes('/reports')) {
      this.expandedSection = 'calls';
    } else if (route.includes('/leads') || route.includes('/opportunities') || route.includes('/pipeline') || route.includes('/companies')) {
      this.expandedSection = 'sales';
    } else if (route.startsWith('/tasks')) {
      this.expandedSection = 'tasks';
    } else if (route.includes('/accounts')) {
      this.expandedSection = 'contacts';
    } else if (route.includes('/email')) {
      this.expandedSection = 'email';
    } else if (route.includes('/ecommerce')) {
      this.expandedSection = 'ecommerce';
    }

    // Store the active section in localStorage for persistence
    localStorage.setItem('expandedSection', this.expandedSection || '');
  }

  // Helper method to check if a route is currently active
  isRouteActive(routePath: string): boolean {
    if (routePath === '/dashboard') {
      return this.currentRoute === '/dashboard'; // Exact match for dashboard
    }

    // Special case for contacts route
    if (routePath === '/contacts' && this.currentRoute.includes('/contacts')) {
      return true;
    }

    // Special case for reports/analytics route
    if (routePath === '/reports' && this.currentRoute.includes('/reports')) {
      return true;
    }

    // Special case for ecommerce routes
    if (routePath === '/ecommerce/product-catalog' && this.currentRoute === '/ecommerce') {
      return true; // Default ecommerce route should highlight product catalog
    }

    // Special case for email routes
    if (routePath === '/email' && this.currentRoute === '/email') {
      return true; // Exact match for email dashboard
    }

    return this.currentRoute.includes(routePath);
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

  // Logout handler
  logout(): void {
    this.authService.signOut();
  }
}