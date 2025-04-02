// src/app/features/leads/lead-form-dialog/lead-form-dialog.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { Lead } from '../../../core/models/lead.model';
import { LeadService } from '../../../core/services/lead.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-lead-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './lead-form-dialog.component.html',
  styleUrls: ['./lead-form-dialog.component.scss']
})
export class LeadFormDialogComponent implements OnInit {
  @Input() lead: Lead | null = null;
  @Output() dialogClose = new EventEmitter<any>();
  
  leadForm!: FormGroup;
  isSubmitting = false;
  companies: {id: string, name: string}[] = [];
  users: {id: string, email: string, full_name: string}[] = [];
  
  statusOptions = [
    'New',
    'Contacted',
    'Qualified', 
    'Proposal',
    'Negotiation',
    'Won',
    'Lost'
  ];
  
  sourceOptions = [
    'Website',
    'Referral',
    'Email Campaign',
    'Cold Call',
    'Social Media',
    'Trade Show',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
    
    if (this.lead) {
      this.patchFormValues();
    }
  }

  initForm(): void {
    this.leadForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company_id: [''],
      status: ['New', [Validators.required]],
      lead_source: ['', [Validators.required]],
      notes: [''],
      assigned_to: [''],
      value: [null, [Validators.min(0)]],
      probability: [null, [Validators.min(0), Validators.max(100)]],
      expected_close_date: ['']
    });
  }
  
  loadDropdownData(): void {
    // Load companies
    this.leadService.getCompanies().subscribe({
      next: (data) => {
        this.companies = data;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      }
    });
    
    // Load users
    this.leadService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }
  
  patchFormValues(): void {
    if (!this.lead) return;
    
    this.leadForm.patchValue({
      name: this.lead.name,
      email: this.lead.email,
      phone: this.lead.phone || '',
      company_id: this.lead.company_id || '',
      status: this.lead.status,
      lead_source: this.lead.lead_source || '',
      notes: this.lead.notes || '',
      assigned_to: this.lead.assigned_to || '',
      value: this.lead.value || null,
      probability: this.lead.probability || null,
      expected_close_date: this.lead.expected_close_date ? 
        this.formatDateForInput(new Date(this.lead.expected_close_date)) : ''
    });
  }
  
  formatDateForInput(date: Date): string {
    // Format date as YYYY-MM-DD for input[type="date"]
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.leadForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.leadForm.controls).forEach(key => {
        const control = this.leadForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.leadForm.value;
    
    let saveOperation: Observable<Lead>;
    
    if (this.lead) {
      // Update existing lead
      saveOperation = this.leadService.updateLead(this.lead.id, formData);
    } else {
      // Create new lead
      saveOperation = this.leadService.createLead(formData);
    }
    
    saveOperation.subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogClose.emit(result);
      },
      error: (error) => {
        console.error('Error saving lead:', error);
        this.isSubmitting = false;
      }
    });
  }

  close(result?: any): void {
    this.dialogClose.emit(result);
  }
  
  // Get formatted user display name
  getUserDisplayName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    if (!user) return 'Unknown User';
    
    return user.full_name || user.email;
  }
  
  // Get control error state
  isInvalid(controlName: string): boolean {
    const control = this.leadForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }
  
  // Get control error message
  getErrorMessage(controlName: string): string {
    const control = this.leadForm.get(controlName);
    if (!control) return '';
    
    if (control.errors?.['required']) {
      return 'This field is required';
    }
    
    if (control.errors?.['email']) {
      return 'Please enter a valid email';
    }
    
    if (control.errors?.['min']) {
      return `Value must be at least ${control.errors['min'].min}`;
    }
    
    if (control.errors?.['max']) {
      return `Value must be at most ${control.errors['max'].max}`;
    }
    
    return 'Invalid value';
  }
  
  // Handle probability change when status changes
  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    const probabilityControl = this.leadForm.get('probability');
    
    if (!probabilityControl) return;
    
    // Set probability based on status
    switch (status) {
      case 'New':
        probabilityControl.setValue(10);
        break;
      case 'Contacted':
        probabilityControl.setValue(20);
        break;
      case 'Qualified':
        probabilityControl.setValue(40);
        break;
      case 'Proposal':
        probabilityControl.setValue(60);
        break;
      case 'Negotiation':
        probabilityControl.setValue(80);
        break;
      case 'Won':
        probabilityControl.setValue(100);
        break;
      case 'Lost':
        probabilityControl.setValue(0);
        break;
    }
  }
}