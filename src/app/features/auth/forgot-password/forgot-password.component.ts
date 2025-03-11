// src/app/features/auth/forgot-password/forgot-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Getter for easy access to form fields
  get f() { return this.forgotPasswordForm.controls; }

  async onSubmit() {
    this.submitted = true;

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;

    try {
      // Implement password reset functionality with your auth service
      // This is a placeholder - you'll need to add this method to your auth service
      const result = await this.authService.resetPassword(this.forgotPasswordForm.value.email);
      
      this.notificationService.success('Password reset link has been sent to your email.');
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.notificationService.error(error.message || 'Failed to send password reset email');
    } finally {
      this.isLoading = false;
    }
  }
}