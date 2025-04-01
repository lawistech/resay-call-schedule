import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed';
  source: string;
  createdAt: Date;
}

@Component({
  selector: 'app-lead-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" (click)="closeDialog()">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" (click)="$event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">{{ data ? 'Edit Lead' : 'Add New Lead' }}</h3>
          <button (click)="closeDialog()" class="text-gray-400 hover:text-gray-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="leadForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Name Field -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter name"
            >
            <div *ngIf="leadForm.get('name')?.hasError('required') && leadForm.get('name')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Name is required
            </div>
          </div>

          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter email"
            >
            <div *ngIf="leadForm.get('email')?.hasError('required') && leadForm.get('email')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Email is required
            </div>
            <div *ngIf="leadForm.get('email')?.hasError('email') && leadForm.get('email')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Please enter a valid email
            </div>
          </div>

          <!-- Phone Field -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              id="phone"
              formControlName="phone"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter phone number"
            >
            <div *ngIf="leadForm.get('phone')?.hasError('required') && leadForm.get('phone')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Phone is required
            </div>
          </div>

          <!-- Company Field -->
          <div>
            <label for="company" class="block text-sm font-medium text-gray-700">Company</label>
            <input
              type="text"
              id="company"
              formControlName="company"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter company name"
            >
            <div *ngIf="leadForm.get('company')?.hasError('required') && leadForm.get('company')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Company is required
            </div>
          </div>

          <!-- Status Field -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              formControlName="status"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed">Closed</option>
            </select>
            <div *ngIf="leadForm.get('status')?.hasError('required') && leadForm.get('status')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Status is required
            </div>
          </div>

          <!-- Source Field -->
          <div>
            <label for="source" class="block text-sm font-medium text-gray-700">Source</label>
            <input
              type="text"
              id="source"
              formControlName="source"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter lead source"
            >
            <div *ngIf="leadForm.get('source')?.hasError('required') && leadForm.get('source')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Source is required
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              (click)="closeDialog()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="!leadForm.valid"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ data ? 'Update' : 'Add' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LeadFormDialogComponent {
  @Input() data: Lead | null = null;
  leadForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.leadForm = this.fb.group({
      name: [this.data?.name || '', Validators.required],
      email: [this.data?.email || '', [Validators.required, Validators.email]],
      phone: [this.data?.phone || '', Validators.required],
      company: [this.data?.company || '', Validators.required],
      status: [this.data?.status || 'New', Validators.required],
      source: [this.data?.source || '', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.leadForm.valid) {
      const formData = this.leadForm.value;
      if (this.data) {
        formData.id = this.data.id;
        formData.createdAt = this.data.createdAt;
      } else {
        formData.id = Date.now().toString();
        formData.createdAt = new Date();
      }
      this.closeDialog(formData);
    }
  }

  closeDialog(result?: any): void {
    const event = new CustomEvent('dialogClose', { 
      bubbles: true,
      detail: result 
    });
    window.dispatchEvent(event);
  }
} 