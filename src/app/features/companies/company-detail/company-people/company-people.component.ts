// src/app/features/companies/company-detail/company-people/company-people.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Contact } from '../../../../core/models/contact.model';
import { Router } from '@angular/router';

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

  constructor(
    private companyService: CompanyService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContacts();
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
}
