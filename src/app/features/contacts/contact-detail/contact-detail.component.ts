// src/app/features/contacts/contact-detail/contact-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Contact } from '../../../core/models/contact.model';
import { Call } from '../../../core/models/call.model';

@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.component.html',
})
export class ContactDetailComponent implements OnInit {
  contactId: string = '';
  contact: Contact | null = null;
  contactCalls: Call[] = [];
  isLoading = true;
  showEditModal = false;
  showCallModal = false;
  
  // Add these new properties
  activeTab: 'details' | 'opportunity' | 'history' | 'calls' = 'details';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    this.contactId = this.route.snapshot.paramMap.get('id') || '';
    if (this.contactId) {
      this.loadContactData();
    } else {
      this.router.navigate(['/contacts']);
    }
  }

  async loadContactData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Fetch contact data
      const { data: contact, error: contactError } = await this.supabaseService.getContactById(this.contactId);
      
      if (contactError) {
        throw contactError;
      }
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      this.contact = contact;
      
      // Load contact calls
      const { data: calls, error: callsError } = await this.supabaseService.getCalls();
      
      if (callsError) {
        throw callsError;
      }
      
      this.contactCalls = (calls || []).filter(call => call.contact_id === this.contactId);
      
    } catch (error: any) {
      this.notificationService.error('Failed to load contact: ' + error.message);
      this.router.navigate(['/contacts']);
    } finally {
      this.isLoading = false;
    }
  }
  
  // Add these methods that are referenced in the template
  
  // For copying text to clipboard
  copyToClipboard(text: string): void {
    this.clipboard.copy(text);
    this.notificationService.success('Copied to clipboard');
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/contacts']);
  }

  // Quick contact methods
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

  openScheduler(): void {
    this.showCallModal = true;
  }

  // Modal methods
  openEditModal(): void {
    this.showEditModal = true;
  }

  openCallModal(): void {
    this.showCallModal = true;
  }

  // Call-related methods
  viewCallDetails(call: Call): void {
    this.router.navigate(['/call-history', call.id]);
  }

  getCallCountByStatus(status: string): number {
    if (!this.contactCalls) return 0;
    return this.contactCalls.filter(call => call.status === status).length;
  }

  calculateCallSuccessRate(): number {
    if (!this.contactCalls || this.contactCalls.length === 0) return 0;
    
    const completedCalls = this.getCallCountByStatus('completed');
    return Math.round((completedCalls / this.contactCalls.length) * 100);
  }

  // For the opportunity pipeline progress
  calculateProgress(): number {
    if (!this.contact) return 0;
    
    // This is a simplified example. Adjust according to your opportunity stages
    if (this.contact.status === 'Active') return 100;
    if (this.contact.key1_quoted) return 80;
    if (this.contact.quote_no) return 60;
    if (this.contact.status === 'In Progress') return 40;
    if (this.contact.status === 'Prospect') return 20;
    
    return 10; // Default minimal progress
  }

  // Other actions
  sendEmail(): void {
    this.emailContact();
  }

  addNote(): void {
    // Implement note adding functionality
    this.notificationService.info('Note adding functionality to be implemented');
  }

  deleteContact(): void {
    if (confirm('Are you sure you want to delete this contact?')) {
      this.supabaseService.deleteContact(this.contactId)
        .then(({ error }) => {
          if (error) throw error;
          this.notificationService.success('Contact deleted successfully');
          this.router.navigate(['/contacts']);
        })
        .catch(error => {
          this.notificationService.error('Failed to delete contact: ' + error.message);
        });
    }
  }
}