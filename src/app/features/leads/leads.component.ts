import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeadFormDialogComponent } from './lead-form-dialog/lead-form-dialog.component';

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
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LeadFormDialogComponent
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Leads</h1>
        <button 
          (click)="openAddLeadDialog()"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Lead
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-6">
        <div class="relative flex-1">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Search leads..."
            class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
          <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <select
          [(ngModel)]="statusFilter"
          class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Proposal">Proposal</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let lead of leads" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{lead.name}}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{lead.email}}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{lead.phone}}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{lead.company}}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getStatusBadgeClass(lead.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{lead.status}}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="editLead(lead)" class="text-blue-600 hover:text-blue-900 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button (click)="deleteLead(lead)" class="text-red-600 hover:text-red-900">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Dialog -->
      <app-lead-form-dialog *ngIf="showDialog" [data]="selectedLead"></app-lead-form-dialog>
    </div>
  `
})
export class LeadsComponent implements OnInit, OnDestroy {
  leads: Lead[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  showDialog: boolean = false;
  selectedLead: Lead | null = null;
  private dialogCloseHandler: EventListener;

  constructor() {
    this.dialogCloseHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const result = customEvent.detail;
      if (result) {
        if (this.selectedLead) {
          // Update existing lead
          const index = this.leads.findIndex(l => l.id === result.id);
          if (index !== -1) {
            this.leads[index] = result;
          }
        } else {
          // Add new lead
          this.leads.push(result);
        }
      }
      this.closeDialog();
    };
  }

  ngOnInit(): void {
    // Mock data for UI demonstration
    this.leads = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        company: 'Acme Corp',
        status: 'New',
        source: 'Website',
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '(555) 987-6543',
        company: 'Tech Solutions',
        status: 'Qualified',
        source: 'Referral',
        createdAt: new Date()
      }
    ];

    // Add event listener for dialog close
    window.addEventListener('dialogClose', this.dialogCloseHandler);
  }

  ngOnDestroy(): void {
    // Remove event listener
    window.removeEventListener('dialogClose', this.dialogCloseHandler);
  }

  getStatusBadgeClass(status: string): string {
    const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status.toLowerCase()) {
      case 'new':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'contacted':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'qualified':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'proposal':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'negotiation':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'closed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  openAddLeadDialog(): void {
    this.selectedLead = null;
    this.showDialog = true;
  }

  editLead(lead: Lead): void {
    this.selectedLead = lead;
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.selectedLead = null;
  }

  deleteLead(lead: Lead): void {
    if (confirm('Are you sure you want to delete this lead?')) {
      this.leads = this.leads.filter(l => l.id !== lead.id);
    }
  }
} 