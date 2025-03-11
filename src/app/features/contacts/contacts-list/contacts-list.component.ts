// src/app/features/contacts/contacts-list/contacts-list.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Contact } from '../../../core/models/contact.model';
import { Company } from '../../../core/models/company.model';

@Component({
  selector: 'app-contacts-list',
  templateUrl: './contacts-list.component.html',
  //styleUrls: ['./contacts-list.component.css']
})
export class ContactsListComponent implements OnInit {
  contacts: Contact[] = [];
  companies: Company[] = [];
  isLoading = true;

  // Enhanced filtering
  searchTerm = '';
  selectedCompanyId = '';
  selectedStatus = '';
  selectedAssigned = ''; 
  quoteFilter = '';
  dateFrom = '';
  dateTo = '';
  
  // View mode toggle
  viewMode: 'grid' | 'table' = 'grid';
  
  // Derived data for filters
  uniqueAssignees: string[] = [];
  
  // Modal state
  showContactModal = false;
  selectedContact: Contact | null = null;
  isEditingContact = false;
  showCallModal = false;
  contactForCall: Contact | null = null;
  showImportModal = false;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Load contacts
      const { data: contacts, error: contactsError } = await this.supabaseService.getContacts();
      
      if (contactsError) {
        throw contactsError;
      }
      
      this.contacts = contacts || [];
      
      // Extract unique assignees for filter dropdown
      this.uniqueAssignees = Array.from(new Set(
        this.contacts
          .map(contact => contact.assigned || '') // Add a fallback empty string
          .filter(assigned => assigned.trim().length > 0)
      ));
      
      // Load companies
      const { data: companies, error: companiesError } = await this.supabaseService.getCompanies();
      
      if (companiesError) {
        throw companiesError;
      }
      
      this.companies = companies || [];
      
    } catch (error: any) {
      this.notificationService.error('Failed to load contacts: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  // Enhanced filtering function
  applyFilters(): void {
    // Explicit call to apply all filters at once
    // The actual filtering happens in the filteredContacts getter
    console.log('Filters applied');
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCompanyId = '';
    this.selectedStatus = '';
    this.selectedAssigned = '';
    this.quoteFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
  }

  // Enhanced filtered contacts getter with all new filters
  get filteredContacts(): Contact[] {
    return this.contacts.filter(contact => {
      // Basic search term filter
      const searchMatch = this.searchTerm === '' || 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (contact.phone && contact.phone.includes(this.searchTerm)) ||
        (contact.opportunity_name && contact.opportunity_name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (contact.quote_no && contact.quote_no.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // Company filter
      const companyMatch = this.selectedCompanyId === '' || contact.company_id === this.selectedCompanyId;
      
      // Status filter
      const statusMatch = this.selectedStatus === '' || 
        (this.selectedStatus === 'Dead' ? contact.is_dead : contact.status === this.selectedStatus);
      
      // Assigned filter
      const assignedMatch = this.selectedAssigned === '' || contact.assigned === this.selectedAssigned;
      
      // Quote filter
      let quoteMatch = true;
      if (this.quoteFilter === 'true') {
        quoteMatch = !!contact.quote_no; // Has a quote number
      } else if (this.quoteFilter === 'false') {
        quoteMatch = !contact.quote_no; // No quote number
      } else if (this.quoteFilter === 'key1') {
        quoteMatch = !!contact.key1_quoted; // KEY1 quoted
      }
      
      // Date filter
      let dateMatch = true;
      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom);
        const receivedDate = contact.date_received ? new Date(contact.date_received) : null;
        dateMatch = receivedDate ? receivedDate >= fromDate : false;
      }
      if (this.dateTo && dateMatch) {
        const toDate = new Date(this.dateTo);
        toDate.setHours(23, 59, 59); // End of the selected day
        const receivedDate = contact.date_received ? new Date(contact.date_received) : null;
        dateMatch = receivedDate ? receivedDate <= toDate : false;
      }
      
      return searchMatch && companyMatch && statusMatch && assignedMatch && quoteMatch && dateMatch;
    });
  }

  // Modal functions
  openCreateContactModal(): void {
    this.selectedContact = null;
    this.isEditingContact = false;
    this.showContactModal = true;
  }

  openEditContactModal(contact: Contact): void {
    this.selectedContact = contact;
    this.isEditingContact = true;
    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
  }

  handleContactSaved(): void {
    this.loadData();
    this.closeContactModal();
  }

  // Call functions
  openCallModal(contact: Contact): void {
    this.contactForCall = contact;
    this.showCallModal = true;
  }

  closeCallModal(): void {
    this.showCallModal = false;
  }

  handleCallSaved(): void {
    this.notificationService.success('Call scheduled successfully');
    this.closeCallModal();
  }

  // Delete contact
  async deleteContact(contactId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    
    try {
      const { error } = await this.supabaseService.deleteContact(contactId);
      
      if (error) {
        throw error;
      }
      
      this.notificationService.success('Contact deleted successfully');
      this.contacts = this.contacts.filter(contact => contact.id !== contactId);
    } catch (error: any) {
      this.notificationService.error('Failed to delete contact: ' + error.message);
    }
  }

  // Import/Export
  handleImportComplete(): void {
    this.showImportModal = false;
    this.loadData();
  }

  exportContacts(): void {
    try {
      // Get visible contacts based on current filters
      const contactsToExport = this.filteredContacts;
      
      // Prepare CSV data
      const headers = [
        'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title',
        'Opportunity Name', 'Quote No.', 'Product Name', 'Quantity', 'Amount', 'Total',
        'Status', 'Times Contacted', 'Date Received', 'Last Chase', 'Chased Date',
        'Assigned', 'KEY1 Quoted', 'Dead', 'Notes'
      ];
      
      const csvRows = [
        headers.join(','),
        ...contactsToExport.map(contact => [
          this.escapeCsvValue(contact.first_name),
          this.escapeCsvValue(contact.last_name),
          this.escapeCsvValue(contact.email || ''),
          this.escapeCsvValue(contact.phone || ''),
          this.escapeCsvValue(contact.company?.name || ''),
          this.escapeCsvValue(contact.job_title || ''),
          this.escapeCsvValue(contact.opportunity_name || ''),
          this.escapeCsvValue(contact.quote_no || ''),
          this.escapeCsvValue(contact.product_name || ''),
          contact.quantity || '',
          contact.amount || '',
          contact.total || '',
          this.escapeCsvValue(contact.status || ''),
          contact.times_contacted || '',
          contact.date_received ? new Date(contact.date_received).toLocaleDateString() : '',
          this.escapeCsvValue(contact.last_chase || ''),
          contact.chased_date ? new Date(contact.chased_date).toLocaleDateString() : '',
          this.escapeCsvValue(contact.assigned || ''),
          contact.key1_quoted ? 'Yes' : 'No',
          contact.is_dead ? 'Yes' : 'No',
          this.escapeCsvValue(contact.notes || '')
        ].join(','))
      ];
      
      // Create and download CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.notificationService.success('Contacts exported successfully');
    } catch (error: any) {
      this.notificationService.error('Failed to export contacts: ' + error.message);
    }
  }
  
  // Helper method for CSV export
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if the value contains comma, quote or newline
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }
}