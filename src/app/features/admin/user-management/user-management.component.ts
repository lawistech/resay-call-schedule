// src/app/features/admin/user-management/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserManagementService } from '../../../core/services/user-management.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = true;
  searchTerm = '';
  selectedRole = '';
  selectedDepartment = '';
  
  // Derived data for filters
  uniqueRoles: string[] = [];
  uniqueDepartments: string[] = [];

  constructor(
    private userManagementService: UserManagementService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userManagementService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.notificationService.error('Failed to load users');
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique roles
    this.uniqueRoles = [...new Set(this.users
      .filter(user => user.role)
      .map(user => user.role as string))];
    
    // Extract unique departments
    this.uniqueDepartments = [...new Set(this.users
      .filter(user => user.department)
      .map(user => user.department as string))];
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Apply search term filter
      const matchesSearch = !this.searchTerm || 
        (user.full_name && user.full_name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // Apply role filter
      const matchesRole = !this.selectedRole || user.role === this.selectedRole;
      
      // Apply department filter
      const matchesDepartment = !this.selectedDepartment || user.department === this.selectedDepartment;
      
      return matchesSearch && matchesRole && matchesDepartment;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedDepartment = '';
    this.filteredUsers = this.users;
  }

  viewUserProfile(userId: string): void {
    this.router.navigate(['/admin/users', userId]);
  }

  calculateProfileCompleteness(user: User): number {
    return this.userManagementService.calculateProfileCompleteness(user);
  }

  getProfileCompletenessClass(percentage: number): string {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  changeUserRole(userId: string, role: string, event: Event): void {
    event.stopPropagation();
    this.userManagementService.changeUserRole(userId, role).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error changing user role:', error);
      }
    });
  }

  deactivateUser(userId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to deactivate this user?')) {
      this.userManagementService.deactivateUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deactivating user:', error);
        }
      });
    }
  }
}
