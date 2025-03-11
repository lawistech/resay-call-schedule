// src/app/core/services/contacts-export.service.ts
import { Injectable } from '@angular/core';
import { Contact } from '../models/contact.model';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class ContactsExportService {
  constructor() {}

  /**
   * Exports contacts to a CSV file
   */
  exportToCsv(contacts: Contact[], filename: string = 'contacts-export.csv'): void {
    // Prepare data for export
    const data = contacts.map(contact => {
      return {
        'First Name': contact.first_name,
        'Last Name': contact.last_name,
        'Email': contact.email || '',
        'Phone': contact.phone || '',
        'Job Title': contact.job_title || '',
        'Company': contact.company?.name || '',
        'Schedule': contact.schedule ? new Date(contact.schedule).toLocaleString() : '',
        'Notes': contact.notes || ''
      };
    });

    // Convert to CSV
    const csv = Papa.unparse(data);
    
    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a hidden link and click it
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}