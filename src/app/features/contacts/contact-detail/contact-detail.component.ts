// src/app/features/contacts/contact-detail/contact-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CompanyRefreshService } from '../../../features/companies/services/company-refresh.service';
import { CompanyService } from '../../companies/services/company.service';
import { Contact } from '../../../core/models/contact.model';
import { Company, CompanyCommunication } from '../../../core/models/company.model';
import { Call } from '../../../core/models/call.model';

@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.component.html',
})
export class ContactDetailComponent implements OnInit {
  contactId: string = '';
  contact: Contact | null = null;
  contactCalls: Call[] = [];
  companies: Company[] = [];
  contactNotes: CompanyCommunication[] = [];
  callNotes: Call[] = [];
  isLoading = true;
  showEditModal = false;
  showCallModal = false;

  // Notes functionality
  showAddNoteForm = false;
  newNoteText = '';
  editingNote: CompanyCommunication | null = null;

  // Add these new properties
  activeTab: 'details' | 'opportunity' | 'notes' | 'calls' = 'details';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private clipboard: Clipboard,
    private companyRefreshService: CompanyRefreshService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.contactId = this.route.snapshot.paramMap.get('id') || '';
    if (this.contactId) {
      this.loadContactData();
      this.loadCompanies();
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

      // Load contact notes if contact has a company
      if (this.contact?.company_id) {
        await this.loadContactNotes();
      }

    } catch (error: any) {
      this.notificationService.error('Failed to load contact: ' + error.message);
      this.router.navigate(['/contacts']);
    } finally {
      this.isLoading = false;
    }
  }

  async loadCompanies(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getCompanies();

      if (error) {
        throw error;
      }

      this.companies = data || [];
    } catch (error: any) {
      console.error('Failed to load companies:', error);
      this.notificationService.error('Failed to load companies: ' + error.message);
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

  // Handle contact saved event
  handleContactSaved(contact: Contact): void {
    this.contact = contact;
    this.loadContactData(); // Reload to get fresh data with company info
    this.showEditModal = false;
    this.notificationService.success('Contact updated successfully');
  }

  // Handle call saved event
  handleCallSaved(call: Call): void {
    this.loadContactData();

    // Notify the company refresh service if the contact has a company_id
    if (this.contact && this.contact.company_id) {
      console.log('Contact detail notifying company refresh service for company ID:', this.contact.company_id);
      this.companyRefreshService.notifyCallScheduled(this.contact.company_id);
    }

    this.showCallModal = false;
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
    if (!this.contact) {
      this.notificationService.error('No contact to delete');
      return;
    }

    const contactName = `${this.contact.first_name} ${this.contact.last_name}`;
    const confirmMessage = `Are you sure you want to delete ${contactName}? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      this.isLoading = true;

      this.supabaseService.deleteContact(this.contactId)
        .then(({ error }) => {
          if (error) throw error;
          this.notificationService.success(`Contact ${contactName} deleted successfully`);
          this.router.navigate(['/contacts']);
        })
        .catch(error => {
          this.notificationService.error('Failed to delete contact: ' + error.message);
          this.isLoading = false;
        });
    }
  }

  // Notes functionality methods
  async loadContactNotes(): Promise<void> {
    try {
      // Load communication notes if contact has a company
      if (this.contact?.company_id) {
        this.companyService.getCompanyCommunications(this.contact.company_id).subscribe({
          next: (communications) => {
            // Filter for notes related to this contact
            this.contactNotes = communications.filter(comm =>
              comm.type === 'note' && comm.contactId === this.contactId
            );
          },
          error: (error) => {
            console.error('Error loading contact notes:', error);
            this.notificationService.error('Failed to load contact notes');
          }
        });
      }

      // Load call notes for this contact
      this.callNotes = this.contactCalls.filter(call =>
        call.notes && call.notes.trim().length > 0
      );

    } catch (error: any) {
      console.error('Error loading contact notes:', error);
      this.notificationService.error('Failed to load contact notes');
    }
  }

  cancelAddNote(): void {
    this.showAddNoteForm = false;
    this.newNoteText = '';
  }

  async saveNewNote(): Promise<void> {
    if (!this.newNoteText || !this.newNoteText.trim() || !this.contact?.company_id) {
      return;
    }

    try {
      const newNote: Partial<CompanyCommunication> = {
        companyId: this.contact.company_id,
        contactId: this.contactId,
        type: 'note',
        date: new Date().toISOString(),
        summary: this.newNoteText.trim()
      };

      this.companyService.addCompanyCommunication(newNote).subscribe({
        next: (savedNote) => {
          this.contactNotes.unshift(savedNote);
          this.notificationService.success('Note added successfully');
          this.cancelAddNote();
        },
        error: (error) => {
          console.error('Error saving note:', error);
          this.notificationService.error('Failed to save note');
        }
      });
    } catch (error: any) {
      console.error('Error saving note:', error);
      this.notificationService.error('Failed to save note');
    }
  }

  editNote(note: CompanyCommunication): void {
    this.editingNote = note;
    this.newNoteText = note.summary;
    this.showAddNoteForm = true;
  }

  async deleteNote(note: CompanyCommunication): Promise<void> {
    const confirmMessage = 'Are you sure you want to delete this note? This action cannot be undone.';

    if (confirm(confirmMessage)) {
      try {
        // Note: You'll need to implement deleteCompanyCommunication in the company service
        // For now, we'll show a placeholder message
        this.notificationService.info('Delete note functionality to be implemented');

        // When implemented, it should be:
        // this.companyService.deleteCompanyCommunication(note.id).subscribe({
        //   next: () => {
        //     this.contactNotes = this.contactNotes.filter(n => n.id !== note.id);
        //     this.notificationService.success('Note deleted successfully');
        //   },
        //   error: (error) => {
        //     console.error('Error deleting note:', error);
        //     this.notificationService.error('Failed to delete note');
        //   }
        // });
      } catch (error: any) {
        console.error('Error deleting note:', error);
        this.notificationService.error('Failed to delete note');
      }
    }
  }

  editContactNotes(): void {
    // Open the edit modal for the contact's built-in notes field
    this.openEditModal();
  }
}