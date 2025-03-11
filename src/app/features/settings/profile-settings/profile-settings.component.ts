// src/app/features/settings/profile-settings/profile-settings.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
 // styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  user: any;
  profile: any;
  isLoadingProfile = true;
  isUpdatingProfile = false;
  isUpdatingPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
  }

  initForms(): void {
    this.profileForm = this.formBuilder.group({
      full_name: ['', Validators.required],
      avatar_url: ['']
    });

    this.passwordForm = this.formBuilder.group({
      current_password: ['', [Validators.required, Validators.minLength(6)]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm_password')?.value
      ? null : { 'mismatch': true };
  }

  async loadUserProfile(): Promise<void> {
    try {
      this.isLoadingProfile = true;
      
      this.authService.currentUser$.subscribe(async (user) => {
        if (user) {
          this.user = user;
          
          // Get user profile
          const { data, error } = await this.supabaseService.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) {
            throw error;
          }
          
          this.profile = data;
          
          this.profileForm.patchValue({
            full_name: this.profile.full_name || '',
            avatar_url: this.profile.avatar_url || ''
          });
        }
      });
    } catch (error: any) {
      this.notificationService.error('Failed to load profile: ' + error.message);
    } finally {
      this.isLoadingProfile = false;
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      return;
    }

    this.isUpdatingProfile = true;

    try {
      const { error } = await this.supabaseService.supabaseClient
        .from('profiles')
        .update(this.profileForm.value)
        .eq('id', this.user.id);

      if (error) {
        throw error;
      }

      this.notificationService.success('Profile updated successfully');
    } catch (error: any) {
      this.notificationService.error('Failed to update profile: ' + error.message);
    } finally {
      this.isUpdatingProfile = false;
    }
  }

  async updatePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isUpdatingPassword = true;

    try {
      // Note: In a real app, you should verify the current password
      // before allowing the user to set a new password
      const { error } = await this.supabaseService.supabaseClient.auth.updateUser({
        password: this.passwordForm.value.new_password
      });

      if (error) {
        throw error;
      }

      this.notificationService.success('Password updated successfully');
      this.passwordForm.reset();
    } catch (error: any) {
      this.notificationService.error('Failed to update password: ' + error.message);
    } finally {
      this.isUpdatingPassword = false;
    }
  }
}