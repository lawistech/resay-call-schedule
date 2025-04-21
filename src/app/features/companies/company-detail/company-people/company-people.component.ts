// src/app/features/companies/company-detail/company-people/company-people.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Contact } from '../../../../core/models/contact.model';
import { Router } from '@angular/router';
import { Call } from '../../../../core/models/call.model';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { CompanyRefreshService } from '../../services/company-refresh.service';

@Component({
  selector: 'app-company-people',
  templateUrl: './company-people.component.html',
  styleUrls: ['./company-people.component.scss']
})
export class CompanyPeopleComponent implements OnInit {
  @Input() companyId: string = '';

  contacts: Contact[] = [];
  isLoading = true;

  // For organization chart view
  decisionMakers: Contact[] = [];
  departmentContacts: { [department: string]: Contact[] } = {};

  // For call scheduling
  showCallModal = false;
  selectedContact: Contact | null = null;
  scheduledCalls: { [contactId: string]: Call } = {};

  constructor(
    private companyService: CompanyService,
    private notificationService: NotificationService,
    private router: Router,
    private supabaseService: SupabaseService,
    private companyRefreshService: CompanyRefreshService
  ) {}

  ngOnInit(): void {
    this.loadContacts();
    this.loadScheduledCalls();
  }

  loadContacts(): void {
    this.isLoading = true;
    console.log('Loading contacts for company ID:', this.companyId);

    if (!this.companyId) {
      this.notificationService.error('Company ID is missing');
      this.isLoading = false;
      return;
    }

    this.companyService.getCompanyContacts(this.companyId).subscribe({
      next: (contacts) => {
        console.log('Contacts loaded:', contacts);
        this.contacts = contacts;
        this.organizeContacts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.notificationService.error('Failed to load company contacts');
        this.isLoading = false;
      }
    });
  }

  organizeContacts(): void {
    // For demo purposes, we'll simulate roles based on job titles
    // In a real implementation, this would use the CompanyContact relationship data

    // Primary contact section has been removed

    // Find decision makers (based on job titles)
    this.decisionMakers = this.contacts.filter(c =>
      c.job_title?.toLowerCase().includes('director') ||
      c.job_title?.toLowerCase().includes('ceo') ||
      c.job_title?.toLowerCase().includes('cfo') ||
      c.job_title?.toLowerCase().includes('cto') ||
      c.job_title?.toLowerCase().includes('president')
    );

    // Group by departments (simulated from job titles)
    this.departmentContacts = {};

    this.contacts.forEach(contact => {
      let department = 'General';

      if (contact.job_title) {
        const title = contact.job_title.toLowerCase();

        if (title.includes('sales')) department = 'Sales';
        else if (title.includes('market')) department = 'Marketing';
        else if (title.includes('tech') || title.includes('it') || title.includes('develop')) department = 'Technical';
        else if (title.includes('finance') || title.includes('account')) department = 'Finance';
        else if (title.includes('hr') || title.includes('human')) department = 'HR';
      }

      if (!this.departmentContacts[department]) {
        this.departmentContacts[department] = [];
      }

      this.departmentContacts[department].push(contact);
    });
  }

  viewContact(contactId: string): void {
    this.router.navigate(['/contacts', contactId]);
  }

  addContact(): void {
    // Navigate to contact form with company pre-selected
    this.router.navigate(['/contacts/add-contact'], {
      queryParams: { company_id: this.companyId }
    });
  }

  getFullName(contact: Contact): string {
    return `${contact.first_name} ${contact.last_name}`;
  }

  getDepartments(): string[] {
    return Object.keys(this.departmentContacts).sort();
  }

  // Call scheduling methods
  scheduleCall(contact: Contact, event?: MouseEvent): void {
    console.log('Schedule call clicked for contact:', contact);

    // Make sure to stop event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Set the selected contact and show the modal
    this.selectedContact = contact;
    this.showCallModal = true;

    console.log('Call modal should be visible now. showCallModal:', this.showCallModal);
  }

  closeCallModal(): void {
    this.showCallModal = false;
    this.selectedContact = null;
  }

  handleCallSaved(call: Call): void {
    this.loadScheduledCalls();

    // Refresh company metrics to update scheduled calls count
    if (this.companyId) {
      this.companyService.calculateCompanyMetrics(this.companyId).subscribe({
        next: (metrics) => {
          console.log('Updated company metrics after scheduling call:', metrics);

          // Notify other components that a call has been scheduled
          this.companyRefreshService.notifyCallScheduled(this.companyId);
        },
        error: (error) => {
          console.error('Error updating company metrics:', error);
        }
      });
    }

    this.notificationService.success('Call scheduled successfully');
  }

  // Load scheduled calls for all contacts in this company
  loadScheduledCalls(): void {
    if (!this.companyId) return;

    this.supabaseService.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(id, company_id)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading scheduled calls:', error);
          return;
        }

        // Reset the scheduled calls map
        this.scheduledCalls = {};

        // Filter calls for contacts in this company
        data?.forEach(call => {
          if (call.contact && call.contact.company_id === this.companyId) {
            this.scheduledCalls[call.contact_id] = call;
          }
        });

        console.log('Scheduled calls for company contacts:', this.scheduledCalls);
      });
  }

  // Check if a contact has a scheduled call
  hasScheduledCall(contactId: string): boolean {
    return !!this.scheduledCalls[contactId];
  }

  // Get the scheduled call for a contact
  getScheduledCall(contactId: string): Call | null {
    return this.scheduledCalls[contactId] || null;
  }

  // Format date for display
  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
