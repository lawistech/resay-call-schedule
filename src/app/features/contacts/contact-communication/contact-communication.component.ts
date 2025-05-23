// src/app/features/contacts/contact-communication/contact-communication.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CompanyService } from '../../companies/services/company.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CompanyCommunication } from '../../../core/models/company.model';
import { Contact } from '../../../core/models/contact.model';
import { Call } from '../../../core/models/call.model';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CompanyRefreshService } from '../../companies/services/company-refresh.service';

@Component({
  selector: 'app-contact-communication',
  templateUrl: './contact-communication.component.html',
  styleUrls: ['./contact-communication.component.scss']
})
export class ContactCommunicationComponent implements OnInit, OnDestroy {
  @Input() contact: Contact | null = null;
  @Input() contactCalls: Call[] = [];

  communications: CompanyCommunication[] = [];
  isLoading = true;

  // For filtering
  filterType: 'all' | 'email' | 'call' | 'meeting' | 'note' = 'all';

  // For adding new communication
  showAddForm = false;
  communicationForm!: FormGroup;
  isSubmitting = false;

  // Make Object available in the template
  Object = Object;

  // Subscription for communication refresh
  private refreshSubscription: Subscription | null = null;

  constructor(
    private companyService: CompanyService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder,
    private companyRefreshService: CompanyRefreshService
  ) {}

  ngOnInit(): void {
    this.loadCommunications();
    this.initForm();

    // Subscribe to communication refresh events
    this.refreshSubscription = this.companyRefreshService.communicationAdded$.subscribe(companyId => {
      if (companyId === this.contact?.company_id) {
        console.log('Refreshing communications after note added');
        this.loadCommunications();
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.communicationForm = this.fb.group({
      type: ['note', Validators.required],
      summary: ['', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      followUpDate: ['']
    });
  }

  loadCommunications(): void {
    if (!this.contact?.company_id) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.companyService.getCompanyCommunications(this.contact.company_id).subscribe({
      next: (communications) => {
        console.log('Loaded communications:', communications);
        // Filter for communications related to this contact or general company communications
        this.communications = communications.filter(comm =>
          !comm.contactId || comm.contactId === this.contact?.id
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading communications:', error);
        this.notificationService.error('Failed to load communications');
        this.isLoading = false;
      }
    });
  }

  filterCommunications(): any[] {
    let filteredComms: any[] = [];

    // Add company communications
    if (this.filterType === 'all' || this.filterType !== 'call') {
      const comms = this.filterType === 'all'
        ? this.communications
        : this.communications.filter(comm => comm.type === this.filterType);
      filteredComms = [...comms];
    }

    // Add call records if showing all or calls specifically
    if (this.filterType === 'all' || this.filterType === 'call') {
      const callComms = this.contactCalls.map(call => ({
        ...call,
        type: 'call' as const,
        date: call.scheduled_at,
        summary: call.notes || call.reason,
        isCallRecord: true
      }));
      filteredComms = [...filteredComms, ...callComms];
    }

    // Sort by date (newest first)
    return filteredComms.sort((a, b) => {
      const dateA = new Date(this.getItemDate(a)).getTime();
      const dateB = new Date(this.getItemDate(b)).getTime();
      return dateB - dateA;
    });
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
    if (this.communicationForm.invalid || !this.contact?.company_id) {
      return;
    }

    this.isSubmitting = true;

    // Create a new communication object from the form values
    const newCommunication: Partial<CompanyCommunication> = {
      companyId: this.contact.company_id,
      contactId: this.contact.id,
      type: this.communicationForm.value.type,
      date: this.communicationForm.value.date,
      summary: this.communicationForm.value.summary,
      followUpDate: this.communicationForm.value.followUpDate || undefined
    };

    // Call the service method to save the communication
    this.companyService.addCompanyCommunication(newCommunication).subscribe({
      next: (savedCommunication) => {
        console.log('Communication saved successfully:', savedCommunication);
        // Add the new communication to the beginning of the list
        this.communications.unshift(savedCommunication);
        this.notificationService.success('Communication added successfully');
        this.toggleAddForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving communication:', error);
        this.notificationService.error('Failed to save communication');
        this.isSubmitting = false;
      }
    });
  }

  // Quick action methods
  callContact(): void {
    if (this.contact?.phone) {
      window.location.href = `tel:${this.contact.phone}`;
    } else {
      this.notificationService.warning('No phone number available');
    }
  }

  emailContact(): void {
    if (this.contact?.email) {
      window.location.href = `mailto:${this.contact.email}`;
    } else {
      this.notificationService.warning('No email address available');
    }
  }

  scheduleCall(): void {
    // This would open a call scheduling modal
    this.notificationService.info('Call scheduling feature to be implemented');
  }

  scheduleMeeting(): void {
    // This would open a meeting scheduling modal
    this.notificationService.info('Meeting scheduling feature to be implemented');
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';

    // Format: Jan 1, 2023 at 2:30 PM
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' at');
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

  isCallRecord(item: any): boolean {
    return item.isCallRecord === true;
  }

  getCallStatus(item: any): string {
    if (this.isCallRecord(item)) {
      return item.status || 'unknown';
    }
    return 'unknown';
  }

  getCallStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getItemType(item: any): string {
    return item.type || 'unknown';
  }

  getItemDate(item: any): string {
    return item.date || item.scheduled_at || '';
  }

  getItemSummary(item: any): string {
    return item.summary || item.notes || item.reason || '';
  }

  getItemFollowUpDate(item: any): string {
    return item.followUpDate || item.follow_up_date || '';
  }

  getItemDuration(item: any): number | undefined {
    return item.duration_minutes;
  }
}
