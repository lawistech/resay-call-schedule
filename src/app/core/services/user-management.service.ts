// src/app/core/services/user-management.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  /**
   * Get all users with their profiles
   */
  getAllUsers(): Observable<User[]> {
    return from(this.supabaseService.supabaseClient
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data as User[];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch users: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific user by ID
   */
  getUserById(userId: string): Observable<User> {
    return from(this.supabaseService.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data as User;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch user: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a user's profile
   */
  updateUserProfile(userId: string, profileData: Partial<User>): Observable<User> {
    return from(this.supabaseService.supabaseClient
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('User profile updated successfully');
        return response.data[0] as User;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update user profile: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Change a user's role
   */
  changeUserRole(userId: string, role: string): Observable<User> {
    return from(this.supabaseService.supabaseClient
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success(`User role changed to ${role}`);
        return response.data[0] as User;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to change user role: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Deactivate a user (admin only)
   * Note: This doesn't actually delete the user, just marks them as inactive
   */
  deactivateUser(userId: string): Observable<void> {
    // In a real app, you might want to implement this differently
    // For example, you might set an 'is_active' flag in the profiles table
    return from(this.supabaseService.supabaseClient
      .from('profiles')
      .update({ role: 'inactive' })
      .eq('id', userId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('User deactivated successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to deactivate user: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Calculate profile completeness percentage
   */
  calculateProfileCompleteness(user: User): number {
    const requiredFields = ['full_name', 'email', 'avatar_url', 'role'];
    const optionalFields = ['job_title', 'department', 'phone_number', 'bio', 'skills', 'location', 'social_links'];
    
    let completedFields = 0;
    let totalFields = requiredFields.length + optionalFields.length;
    
    // Check required fields (weighted more heavily)
    requiredFields.forEach(field => {
      if (user[field as keyof User]) completedFields += 2;
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
      if (user[field as keyof User]) completedFields += 1;
    });
    
    // Calculate percentage (max score is requiredFields.length*2 + optionalFields.length)
    const maxScore = requiredFields.length * 2 + optionalFields.length;
    return Math.round((completedFields / maxScore) * 100);
  }
}
