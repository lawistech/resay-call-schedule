// src/app/features/leads/leads.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Lead } from '../../core/models/lead.model';
import { LeadService } from '../../core/services/lead.service';
import { NotificationService } from '../../core/services/notification.service';
import { LeadFormDialogComponent } from './lead-form-dialog/lead-form-dialog.component';
import { LeadWizardComponent } from './lead-wizard/lead-wizard.component';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LeadFormDialogComponent,
    LeadWizardComponent
  ],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss']
})
export class LeadsComponent implements OnInit, OnDestroy {
  leads: Lead[] = [];
  filteredLeads: Lead[] = [];
  isLoading = false;
  searchTerm: string = '';
  statusFilter: string = '';
  sourceFilter: string = '';
  showDialog = false;
  selectedLead: Lead | null = null;
  showLeadWizard = false;

  availableStatuses = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost'
  ];

  availableSources = [
    'Website',
    'Referral',
    'Email Campaign',
    'Cold Call',
    'Social Media',
    'Trade Show',
    'BCB',
    'Resay',
    'AE',
    'Sumup',
    'Other'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private leadService: LeadService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLeads(): void {
    this.isLoading = true;
    this.leadService.getLeads()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.leads = data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading leads:', error);
          this.isLoading = false;
          this.notificationService.error('Failed to load leads');
        }
      });
  }

  openAddLeadDialog(): void {
    this.selectedLead = null;
    this.showDialog = true;
  }

  openLeadWizard(): void {
    this.showLeadWizard = true;
  }

  closeLeadWizard(): void {
    this.showLeadWizard = false;
  }

  handleWizardComplete(result: any): void {
    this.showLeadWizard = false;
    this.loadLeads(); // Refresh the leads list
  }

  editLead(lead: Lead): void {
    this.selectedLead = lead;
    this.showDialog = true;
  }

  closeDialog(refreshData: boolean = false): void {
    this.showDialog = false;
    this.selectedLead = null;

    if (refreshData) {
      this.loadLeads();
    }
  }

  deleteLead(lead: Lead): void {
    if (confirm(`Are you sure you want to delete the lead for ${lead.name}?`)) {
      this.leadService.deleteLead(lead.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remove from local array
            this.leads = this.leads.filter(l => l.id !== lead.id);
            this.applyFilters();
            this.notificationService.success('Lead deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting lead:', error);
            this.notificationService.error('Failed to delete lead');
          }
        });
    }
  }

  applyFilters(): void {
    let filtered = [...this.leads];

    // Apply search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(searchLower)) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(lead => lead.status === this.statusFilter);
    }

    // Apply source filter
    if (this.sourceFilter) {
      filtered = filtered.filter(lead => lead.lead_source === this.sourceFilter);
    }

    this.filteredLeads = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.sourceFilter = '';
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    const baseClasses = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status) {
      case 'New':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Contacted':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'Qualified':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'Proposal':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Negotiation':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'Won':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Lost':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  handleDialogClose(result?: any): void {
    if (result) {
      this.loadLeads();
    }
    this.closeDialog();
  }

  // Helper methods to replace template filter functions

  // Count active leads
  getActiveLeadsCount(): number {
    return this.leads.filter(l => l.status !== 'Lost').length;
  }

  // Calculate active leads percentage
  getActiveLeadsPercentage(): number {
    return this.leads.length > 0
      ? (this.getActiveLeadsCount() / this.leads.length) * 100
      : 0;
  }

  // Count won leads
  getWonLeadsCount(): number {
    return this.leads.filter(l => l.status === 'Won').length;
  }

  // Count lost leads
  getLostLeadsCount(): number {
    return this.leads.filter(l => l.status === 'Lost').length;
  }

  // Calculate won/lost ratio
  getWonLostRatio(): string {
    return `${this.getWonLeadsCount()} / ${this.getLostLeadsCount()}`;
  }

  // Calculate conversion rate
  getConversionRate(): number {
    return this.leads.length > 0
      ? Math.round((this.getWonLeadsCount() / this.leads.length) * 100)
      : 0;
  }

  // Calculate conversion percentage for progress bar
  getWonLostPercentage(): number {
    const totalClosedLeads = this.getWonLeadsCount() + this.getLostLeadsCount();
    return totalClosedLeads > 0
      ? (this.getWonLeadsCount() / totalClosedLeads) * 100
      : 0;
  }

  // Calculates the value of the leads pipeline
  get totalPipelineValue(): number {
    return this.leads
      .filter(lead => lead.status !== 'Lost')
      .reduce((sum, lead) => sum + (lead.value || 0), 0);
  }

  // Calculates the weighted value of the leads pipeline
  get weightedPipelineValue(): number {
    return this.leads
      .filter(lead => lead.status !== 'Lost')
      .reduce((sum, lead) => {
        const probability = lead.probability || 0;
        const value = lead.value || 0;
        return sum + (value * probability / 100);
      }, 0);
  }

  // Helper to format date
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  // Helper to format currency
  formatCurrency(value?: number): string {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  }
}