// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  //styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  returnUrl: string = '/dashboard';
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Check if user is already logged in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // User is already logged in, redirect to dashboard
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }

  // Getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      const result = await this.authService.signIn(email, password);

      if (result.success) {
        this.notificationService.success('Login successful');
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.errorMessage = result.message || 'Invalid email or password';
        this.notificationService.error(this.errorMessage);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed';
      this.notificationService.error(this.errorMessage);
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Handle "Enter" key press
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSubmit();
    }
  }

  // Clear error message when user starts typing again
  onInputChange() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }
}