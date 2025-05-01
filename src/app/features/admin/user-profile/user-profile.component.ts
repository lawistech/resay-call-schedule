// src/app/features/admin/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserManagementService } from '../../../core/services/user-management.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  userId!: string;
  user: User | null = null;
  profileForm!: FormGroup;
  isLoading = true;
  isUpdating = false;
  profileCompleteness = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private userManagementService: UserManagementService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.loadUserProfile();
  }

  initForm(): void {
    this.profileForm = this.formBuilder.group({
      full_name: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      role: [''],
      job_title: [''],
      department: [''],
      phone_number: [''],
      bio: [''],
      location: [''],
      skills: [''],
      'social_links.linkedin': [''],
      'social_links.twitter': [''],
      'social_links.github': [''],
      'social_links.website': ['']
    });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userManagementService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.profileCompleteness = this.userManagementService.calculateProfileCompleteness(user);
        
        // Populate the form
        this.profileForm.patchValue({
          full_name: user.full_name || '',
          email: user.email || '',
          role: user.role || '',
          job_title: user.job_title || '',
          department: user.department || '',
          phone_number: user.phone_number || '',
          bio: user.bio || '',
          location: user.location || '',
          skills: user.skills ? user.skills.join(', ') : '',
          'social_links.linkedin': user.social_links?.linkedin || '',
          'social_links.twitter': user.social_links?.twitter || '',
          'social_links.github': user.social_links?.github || '',
          'social_links.website': user.social_links?.website || ''
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.notificationService.error('Failed to load user profile');
        this.isLoading = false;
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isUpdating = true;
    
    // Extract form values
    const formValues = this.profileForm.getRawValue();
    
    // Process skills (convert comma-separated string to array)
    const skills = formValues.skills ? 
      formValues.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill) : 
      [];
    
    // Build social links object
    const social_links = {
      linkedin: formValues['social_links.linkedin'],
      twitter: formValues['social_links.twitter'],
      github: formValues['social_links.github'],
      website: formValues['social_links.website']
    };
    
    // Create profile data object
    const profileData: Partial<User> = {
      full_name: formValues.full_name,
      role: formValues.role,
      job_title: formValues.job_title,
      department: formValues.department,
      phone_number: formValues.phone_number,
      bio: formValues.bio,
      location: formValues.location,
      skills,
      social_links
    };
    
    this.userManagementService.updateUserProfile(this.userId, profileData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.profileCompleteness = this.userManagementService.calculateProfileCompleteness(updatedUser);
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error updating user profile:', error);
        this.isUpdating = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  getProfileCompletenessClass(): string {
    if (this.profileCompleteness < 30) return 'bg-red-500';
    if (this.profileCompleteness < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }
}
