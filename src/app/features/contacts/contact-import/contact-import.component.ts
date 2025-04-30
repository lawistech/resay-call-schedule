// src/app/features/contacts/contact-import/contact-import.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Contact } from '../../../core/models/contact.model';
import * as Papa from 'papaparse';

interface ImportedContact {
  name: string;
  number: string;
  schedule?: string;
  isNew?: boolean;
  matchedContactId?: string;

  // Date fields
  chasedDate?: string;
  dateReceived?: string;

  // Additional fields
  timesContacted?: number;
  quoteNo?: string;
  lastChase?: string;
  opportunityName?: string;
  productName?: string;
  quantity?: number;
  amount?: number;
  total?: number;
  notes?: string;
  assigned?: string;
  status?: string;
  isDead?: boolean;
  key1Quoted?: boolean;
  email?: string;
  company?: string;
}

@Component({
  selector: 'app-contact-import',
  templateUrl: './contact-import.component.html',
  styleUrl:'./contact-import.component.css',
})
export class ContactImportComponent implements OnInit {
  @Output() importComplete = new EventEmitter<void>();

  importForm!: FormGroup;
  isLoading = false;
  isProcessing = false;
  importedContacts: ImportedContact[] = [];
  processingProgress = 0;
  showPreview = false;

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.importForm = this.formBuilder.group({
      file: [''],
      hasHeader: [true],
      delimiter: [','],
      defaultTime: ['09:00'] // Default time for scheduling (9:00 AM)
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.importForm.patchValue({
        file: file
      });
      this.parseFile(file);
    }
  }

  parseFile(file: File): void {
    this.isLoading = true;
    this.importedContacts = [];

    Papa.parse(file, {
      header: this.importForm.get('hasHeader')?.value,
      skipEmptyLines: true,
      delimiter: this.importForm.get('delimiter')?.value,
      complete: async (results) => {
        try {
          // Map CSV data to our format
          const rawData = results.data as any[];

          for (const row of rawData) {
            // Determine field positions based on whether there's a header
            const hasHeader = this.importForm.get('hasHeader')?.value;
            let mapping: any = {};

            if (hasHeader) {
              // Map all possible column names with common variations
              mapping = {
                firstName: row.first_name || row['First Name'] || row.firstname || '',
                lastName: row.last_name || row['Last Name'] || row.lastname || '',
                email: row.email || row.Email || row['Email Address'] || '',
                phone: row.phone || row.Phone || row['Phone Number'] || '',
                company: row.company || row.Company || row['Company '] || row['Company Name'] || '',
                jobTitle: row.job_title || row['Job Title'] || row.position || '',

                // Date fields with improved mapping
                chasedDate: row['Chased Date'] || row.chased_date || row['ChaseDate'] || '',
                dateReceived: row['Date Received'] || row['Date Received '] || row.date_received || '',

                // Additional fields with improved mapping
                timesContacted: row['Times Contacted'] || row.times_contacted || 0,
                quoteNo: row['Quote No.'] || row.quote_no || '',
                lastChase: row['Last Chase'] || row.last_chase || '',
                opportunityName: row['Opportunity Name'] || row.opportunity_name || '',
                productName: row['Product'] || row.product_name || row['Product Name'] || '',
                quantity: row.quantity || row.Quantity || 0,
                amount: row.amount || row.Amount || '',
                total: row.total || row.Total || '',
                notes: row.notes || row.Notes || '',
                assigned: row.assigned || row.Assigned || '',
                status: row.status || row.Status || '',
                isDead: this.parseBooleanField(row.Dead) || this.parseBooleanField(row.is_dead) || false,
                key1Quoted: this.parseBooleanField(row.KEY) || this.parseBooleanField(row.key1_quoted) || this.parseBooleanField(row['KEY1 Quoted']) || false,
                customerContact: row['Customer Contact'] || '',
              };

              // If first name and last name are combined in one field
              if (mapping.firstName === '' && mapping.lastName === '' && row['Customer Contact']) {
                const nameParts = row['Customer Contact'].split(' ');
                mapping.firstName = nameParts[0] || '';
                mapping.lastName = nameParts.slice(1).join(' ') || '';
              }
            } else {
              // No header, map by position (this would need customization based on your actual file structure)
              const values = Object.values(row);
              mapping = {
                firstName: values[0] || '',
                lastName: '',
                email: values[8] || '',
                phone: values[9] || '',
                company: values[5] || '',

                // Date fields
                chasedDate: values[0] || '',
                dateReceived: values[1] || '',

                // Additional fields
                timesContacted: values[2] || 0,
                quoteNo: values[3] || '',
                lastChase: values[4] || '',
                opportunityName: values[6] || '',
                productName: values[10] || '',
                quantity: values[11] || 0,
                amount: values[12] || 0,
                total: values[13] || 0,
                notes: values[14] || '',
                assigned: values[15] || '',
                status: values[16] || '',
                isDead: this.parseBooleanField(values[17]) || false,
                key1Quoted: this.parseBooleanField(values[18]) || false,
                customerContact: values[7] || '',
              };

              // If we have a customer contact field but no first/last name, split it
              if (mapping.firstName === '' && mapping.customerContact) {
                const nameParts = mapping.customerContact.split(' ');
                mapping.firstName = nameParts[0] || '';
                mapping.lastName = nameParts.slice(1).join(' ') || '';
              }
            }

            // Create name from first and last name if available
            let fullName = '';
            if (mapping.firstName || mapping.lastName) {
              fullName = `${mapping.firstName} ${mapping.lastName}`.trim();
            } else if (mapping.customerContact) {
              fullName = mapping.customerContact;
            }

            // Add to imported contacts if it has at least a name and phone/email
            if ((fullName || mapping.customerContact) && (mapping.phone || mapping.email)) {
              // Determine the schedule date from the chased date
              let scheduleDate = '';
              if (mapping.chasedDate) {
                // Attempt to parse the date in different formats
                scheduleDate = this.parseDateField(mapping.chasedDate);
              }

              // Create a properly structured ImportedContact object
              const contact: ImportedContact = {
                name: fullName || mapping.customerContact,
                number: mapping.phone,
                email: mapping.email,
                company: mapping.company,
                schedule: scheduleDate, // Use chased date as schedule
                chasedDate: mapping.chasedDate ? this.parseDateField(mapping.chasedDate) : undefined,
                dateReceived: mapping.dateReceived ? this.parseDateField(mapping.dateReceived) : undefined,
                timesContacted: typeof mapping.timesContacted === 'string' ?
                  parseInt(mapping.timesContacted) || 0 : mapping.timesContacted,
                quoteNo: mapping.quoteNo,
                lastChase: mapping.lastChase,
                opportunityName: mapping.opportunityName,
                productName: mapping.productName,
                quantity: typeof mapping.quantity === 'string' ?
                  parseFloat(mapping.quantity) || 0 : mapping.quantity,
                amount: mapping.amount,
                total: mapping.total,
                notes: mapping.notes,
                assigned: mapping.assigned,
                status: mapping.status,
                isDead: mapping.isDead,
                key1Quoted: mapping.key1Quoted
              };

              this.importedContacts.push(contact);
            }
          }

          await this.checkExistingContacts();
          this.showPreview = true;
        } catch (error) {
          console.error('Error parsing file:', error);
          this.notificationService.error('Failed to parse the import file');
        } finally {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        this.notificationService.error('Failed to parse the CSV file');
        this.isLoading = false;
      }
    });
  }

  // Helper method to parse boolean fields from various formats
  parseBooleanField(value: any): boolean {
    if (value === undefined || value === null) return false;

    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;

    if (typeof value === 'string') {
      const lowercaseValue = value.toLowerCase().trim();
      return lowercaseValue === 'true' ||
             lowercaseValue === 'yes' ||
             lowercaseValue === 'y' ||
             lowercaseValue === '1' ||
             lowercaseValue === 'won';
    }

    return false;
  }

  // Helper method to parse date fields from various formats
  parseDateField(dateStr: string): string {
    if (!dateStr) return '';

    // Remove any leading/trailing whitespace
    dateStr = dateStr.trim();

    try {
      // Try to parse DD/MM/YYYY format
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Try to parse YYYY/MM/DD format
      if (dateStr.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Try to parse DD-MM-YYYY format
      if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Try to parse MM/DD/YYYY format (common US format)
      if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        // Only if the first part is a valid month (1-12)
        if (parseInt(parts[0]) >= 1 && parseInt(parts[0]) <= 12) {
          const date = new Date(`${parts[0]}/${parts[1]}/${parts[2]}`);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }

      // For any other format, let JavaScript try to parse it
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      // If nothing worked, return the original string
      return dateStr;
    } catch (e) {
      console.warn(`Failed to parse date: ${dateStr}`, e);
      return dateStr;
    }
  }

  async checkExistingContacts(): Promise<void> {
    // Get all existing contacts to check for matches
    const { data: existingContacts, error } = await this.supabaseService.getContacts();

    if (error) {
      this.notificationService.error('Failed to fetch existing contacts');
      return;
    }

    // Check each imported contact against existing ones
    this.importedContacts = this.importedContacts.map(importedContact => {
      // Try to match by phone number or email
      const match = existingContacts?.find(c =>
        (importedContact.number && c.phone === importedContact.number) ||
        (importedContact.email && c.email === importedContact.email)
      );

      return {
        ...importedContact,
        isNew: !match,
        matchedContactId: match?.id
      };
    });
  }

  async processImport(): Promise<void> {
    if (this.importedContacts.length === 0) {
      this.notificationService.warning('No contacts to import');
      return;
    }

    this.isProcessing = true;
    this.processingProgress = 0;

    try {
      // Get default time for scheduling from form
      const defaultTime = this.importForm.get('defaultTime')?.value || '09:00';

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < this.importedContacts.length; i++) {
        const contact = this.importedContacts[i];

        try {
          if (contact.isNew) {
            // Create new contact
            const nameParts = contact.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Prepare contact data with properly formatted dates
            const newContact: Partial<Contact> = {
              first_name: firstName,
              last_name: lastName,
              phone: contact.number,
              email: contact.email,

              // Use chased date for scheduling if available, otherwise use today's date with default time
              schedule: contact.chasedDate ? this.formatScheduleDate(contact.chasedDate, defaultTime) : undefined,

              // Format other dates properly
              chased_date: contact.chasedDate,
              date_received: contact.dateReceived,

              // Additional fields
              times_contacted: contact.timesContacted,
              quote_no: contact.quoteNo,
              last_chase: contact.lastChase,
              opportunity_name: contact.opportunityName,
              product_name: contact.productName,
              quantity: contact.quantity,
              amount: this.parseAmount(contact.amount),
              total: this.parseAmount(contact.total),
              notes: contact.notes,
              assigned: contact.assigned,
              status: contact.status,
              is_dead: contact.isDead,
              key1_quoted: contact.key1Quoted
            };

            const { error: createError } = await this.supabaseService.createContact(newContact);

            if (createError) {
              throw createError;
            }

            successCount++;
          } else if (contact.matchedContactId) {
            // Update existing contact with the new information
            const updateFields: Partial<Contact> = {
              // Only update if the field is present in the imported contact
              phone: contact.number || undefined,
              email: contact.email || undefined,

              // Use chased date for scheduling if available
              schedule: contact.chasedDate ?
                this.formatScheduleDate(contact.chasedDate, defaultTime) : undefined,

              // Additional fields to update if present
              opportunity_name: contact.opportunityName || undefined,
              quote_no: contact.quoteNo || undefined,
              product_name: contact.productName || undefined,
              quantity: contact.quantity || undefined,
              amount: contact.amount ? this.parseAmount(contact.amount) : undefined,
              total: contact.total ? this.parseAmount(contact.total) : undefined,
              notes: contact.notes || undefined,
              assigned: contact.assigned || undefined,
              status: contact.status || undefined,
              is_dead: contact.isDead !== undefined ? contact.isDead : undefined,
              key1_quoted: contact.key1Quoted !== undefined ? contact.key1Quoted : undefined,
              chased_date: contact.chasedDate || undefined,
              date_received: contact.dateReceived || undefined,
              times_contacted: contact.timesContacted !== undefined ? contact.timesContacted : undefined,
              last_chase: contact.lastChase || undefined
            };

            // Update the contact
            const { error: updateError } = await this.supabaseService.updateContact(
              contact.matchedContactId,
              updateFields
            );

            if (updateError) {
              throw updateError;
            }

            successCount++;
          } else {
            // Contact exists but no updating needed
            successCount++;
          }
        } catch (error: any) {
          console.error(`Error processing contact ${contact.name}:`, error);
          errorCount++;
        }

        // Update progress
        this.processingProgress = Math.round(((i + 1) / this.importedContacts.length) * 100);
      }

      // Show summary notification
      this.notificationService.success(
        `Import completed: ${successCount} contacts processed successfully, ${errorCount} errors`
      );

      // Emit completion event
      this.importComplete.emit();
    } catch (error: any) {
      console.error('Error during import:', error);
      this.notificationService.error('An error occurred during import: ' + error.message);
    } finally {
      this.isProcessing = false;
      this.showPreview = false;
      this.importedContacts = [];
      this.importForm.get('file')?.setValue('');
    }
  }

  // Helper method to format a date for scheduling
  formatScheduleDate(isoDate: string, defaultTime: string): string {
    try {
      if (!isoDate) return '';

      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return '';

      // Extract time components from the default time
      const [hours, minutes] = defaultTime.split(':').map(Number);

      // Set the time components
      date.setHours(hours || 0, minutes || 0, 0, 0);

      return date.toISOString();
    } catch (e) {
      console.warn(`Failed to format schedule date: ${isoDate}`, e);
      return '';
    }
  }

  // Parse currency amounts from strings (handle £ symbol, commas, etc.)
  parseAmount(amountStr: string | number | undefined): number | undefined {
    if (amountStr === undefined || amountStr === null) return undefined;

    // If it's already a number, return it
    if (typeof amountStr === 'number') return amountStr;

    if (typeof amountStr === 'string') {
      // Remove currency symbols, commas, and spaces
      const cleanedStr = amountStr.replace(/[£,\s]/g, '');

      // Parse the clean string to a float
      const amount = parseFloat(cleanedStr);

      // Return the amount if valid, otherwise undefined
      return !isNaN(amount) ? amount : undefined;
    }

    return undefined;
  }

  cancelImport(): void {
    this.showPreview = false;
    this.importedContacts = [];
    this.importForm.reset({
      hasHeader: true,
      delimiter: ',',
      defaultTime: '09:00'
    });
  }
}