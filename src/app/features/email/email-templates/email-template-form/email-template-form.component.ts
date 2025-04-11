// src/app/features/email/email-templates/email-template-form/email-template-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmailService } from '../../../../core/services/email.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmailTemplate } from '../../../../core/models/email-template.model';

@Component({
  selector: 'app-email-template-form',
  templateUrl: './email-template-form.component.html',
  styleUrls: ['./email-template-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class EmailTemplateFormComponent implements OnInit {
  templateForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  templateId: string | null = null;

  // Predefined categories
  categories: string[] = [
    'Welcome',
    'Follow-up',
    'Meeting',
    'Quote',
    'Thank You',
    'Newsletter',
    'Announcement',
    'Other'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Check if we're in edit mode
    this.templateId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.templateId;

    if (this.isEditMode && this.templateId) {
      this.loadTemplate(this.templateId);
    }
  }

  initForm(): void {
    this.templateForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: [''],
      subject: ['', [Validators.required]],
      htmlContent: ['', [Validators.required]],
      plainContent: [''],
      category: [''],
      tags: [''],
      variables: ['']
    });
  }

  loadTemplate(id: string): void {
    this.isLoading = true;

    this.emailService.getEmailTemplateById(id).subscribe({
      next: (template) => {
        // Populate the form with template data
        this.templateForm.patchValue({
          name: template.name,
          description: template.description,
          subject: template.subject,
          htmlContent: template.htmlContent,
          plainContent: template.plainContent,
          category: template.category,
          tags: template.tags ? template.tags.join(', ') : '',
          variables: template.variables ? template.variables.join(', ') : ''
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading template:', error);
        this.notificationService.error('Failed to load template');
        this.isLoading = false;
        this.router.navigate(['/email/templates']);
      }
    });
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.templateForm.controls).forEach(key => {
        this.templateForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Process tags and variables from comma-separated strings to arrays
    const formValue = { ...this.templateForm.value };

    if (formValue.tags) {
      formValue.tags = formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    }

    if (formValue.variables) {
      formValue.variables = formValue.variables.split(',').map((variable: string) => variable.trim()).filter((variable: string) => variable);
    }

    if (this.isEditMode && this.templateId) {
      // Update existing template
      this.emailService.updateEmailTemplate(this.templateId, formValue).subscribe({
        next: () => {
          this.notificationService.success('Template updated successfully');
          this.router.navigate(['/email/templates']);
        },
        error: (error) => {
          console.error('Error updating template:', error);
          this.notificationService.error('Failed to update template');
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new template
      this.emailService.createEmailTemplate(formValue).subscribe({
        next: () => {
          this.notificationService.success('Template created successfully');
          this.router.navigate(['/email/templates']);
        },
        error: (error) => {
          console.error('Error creating template:', error);
          this.notificationService.error('Failed to create template');
          this.isSubmitting = false;
        }
      });
    }
  }

  // Helper method to check if a field is invalid and touched
  isFieldInvalid(fieldName: string): boolean {
    const field = this.templateForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Helper method to get error message for a field
  getErrorMessage(fieldName: string): string {
    const field = this.templateForm.get(fieldName);

    if (!field) return '';

    if (field.hasError('required')) {
      return 'This field is required';
    }

    return 'Invalid input';
  }
}
