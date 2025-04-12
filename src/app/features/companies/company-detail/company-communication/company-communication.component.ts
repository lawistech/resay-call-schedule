// src/app/features/companies/company-detail/company-communication/company-communication.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CompanyCommunication } from '../../../../core/models/company.model';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-company-communication',
  templateUrl: './company-communication.component.html',
  styleUrls: ['./company-communication.component.scss']
})
export class CompanyCommunicationComponent implements OnInit {
  @Input() companyId: string = '';
  
  communications: CompanyCommunication[] = [];
  isLoading = true;
  
  // For filtering
  filterType: 'all' | 'email' | 'call' | 'meeting' | 'note' = 'all';
  
  // For adding new communication
  showAddForm = false;
  communicationForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private companyService: CompanyService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadCommunications();
    this.initForm();
  }

  initForm(): void {
    this.communicationForm = this.fb.group({
      type: ['note', Validators.required],
      summary: ['', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      followUpDate: [''],
      contactId: ['']
    });
  }

  loadCommunications(): void {
    this.isLoading = true;
    this.companyService.getCompanyCommunications(this.companyId).subscribe({
      next: (communications) => {
        this.communications = communications;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load communications');
        this.isLoading = false;
      }
    });
  }

  filterCommunications(): CompanyCommunication[] {
    if (this.filterType === 'all') {
      return this.communications;
    }
    return this.communications.filter(comm => comm.type === this.filterType);
  }

  setFilter(type: 'all' | 'email' | 'call' | 'meeting' | 'note'): void {
    this.filterType = type;
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.communicationForm.reset({
        type: 'note',
        date: new Date().toISOString().substring(0, 10)
      });
    }
  }

  onSubmit(): void {
    if (this.communicationForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    
    // In a real implementation, this would call a service method to save the communication
    // For now, we'll simulate adding it to the list
    const newCommunication: CompanyCommunication = {
      id: 'temp-' + Date.now(),
      companyId: this.companyId,
      type: this.communicationForm.value.type,
      date: this.communicationForm.value.date,
      summary: this.communicationForm.value.summary,
      contactId: this.communicationForm.value.contactId || undefined,
      followUpDate: this.communicationForm.value.followUpDate || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Simulate API call
    setTimeout(() => {
      this.communications.unshift(newCommunication);
      this.notificationService.success('Communication added successfully');
      this.toggleAddForm();
      this.isSubmitting = false;
    }, 500);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'email':
        return 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
      case 'call':
        return 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
      case 'meeting':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'note':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      default:
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'call':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'meeting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'note':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getTypeIconColor(type: string): string {
    switch (type) {
      case 'email':
        return 'text-blue-500';
      case 'call':
        return 'text-green-500';
      case 'meeting':
        return 'text-purple-500';
      case 'note':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  }
}
