import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { OpportunitiesService } from './opportunities.service';
import { Opportunity } from '../../core/models/company.model';
import { OpportunityFormComponent } from './opportunity-form/opportunity-form.component';
import { OpportunityDetailsModalComponent } from './opportunity-details-modal/opportunity-details-modal.component';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OpportunityFormComponent,
    OpportunityDetailsModalComponent
  ],
  templateUrl: './opportunities.component.html',
})
export class OpportunitiesComponent implements OnInit {
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  statusFilter: string = ''; // Keep for backward compatibility
  activeStatuses: Set<string> = new Set(['New', 'In Progress']); // Default to New and In Progress
  searchTerm: string = '';
  showOpportunityForm: boolean = false;
  selectedOpportunity: Opportunity | null = null;
  showDetailsModal: boolean = false;
  isSaving: boolean = false;

  constructor(
    private opportunitiesService: OpportunitiesService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOpportunities();
  }

  // After loading opportunities, apply the default filter
  private applyDefaultFilter(): void {
    // Filter opportunities to show only New and In Progress by default
    this.filterOpportunities();
  }

  loadOpportunities(): void {
    this.opportunitiesService.getOpportunities().subscribe({
      next: (opportunities) => {
        this.opportunities = opportunities;
        // Apply the filter instead of just copying all opportunities
        this.applyDefaultFilter();
      },
      error: (error) => {
        console.error('Error fetching opportunities:', error);
        this.notificationService.error('Failed to load opportunities');
      }
    });
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0';
    switch (status) {
      case 'New':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'In Progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Won':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Lost':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  filterOpportunities(): void {
    let filtered = this.opportunities;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(opportunity =>
        (opportunity.title?.toLowerCase() || '').includes(term) ||
        (opportunity.description?.toLowerCase() || '').includes(term)
      );
    }

    // If we have active statuses, filter by them
    if (this.activeStatuses.size > 0) {
      filtered = filtered.filter(opportunity => this.activeStatuses.has(opportunity.status));
    }

    this.filteredOpportunities = filtered;
  }

  openOpportunityForm(opportunity?: Opportunity): void {
    this.selectedOpportunity = opportunity || null;
    this.showOpportunityForm = true;
  }

  closeOpportunityForm(): void {
    this.showOpportunityForm = false;
    this.selectedOpportunity = null;
  }

  handleSaveOpportunity(opportunityData: Partial<Opportunity>): void {
    this.isSaving = true;

    if (opportunityData.id) {
      // Update existing opportunity
      this.opportunitiesService.updateOpportunity(opportunityData.id, opportunityData).subscribe({
        next: (updatedOpportunity) => {
          // Update local array
          const index = this.opportunities.findIndex(o => o.id === updatedOpportunity.id);
          if (index !== -1) {
            this.opportunities[index] = updatedOpportunity;
            this.filterOpportunities();
            this.notificationService.success('Opportunity updated successfully');
          }
          this.isSaving = false;
          this.closeOpportunityForm();
        },
        error: (err) => {
          console.error('Error updating opportunity:', err);
          this.notificationService.error('Failed to update opportunity');
          this.isSaving = false;
        }
      });
    } else {
      // Create new opportunity
      this.opportunitiesService.addOpportunity(opportunityData).subscribe({
        next: (newOpportunity) => {
          this.opportunities.unshift(newOpportunity); // Add to beginning of array
          this.filterOpportunities();
          this.notificationService.success('Opportunity created successfully');
          this.isSaving = false;
          this.closeOpportunityForm();
        },
        error: (err) => {
          console.error('Error adding opportunity:', err);
          this.notificationService.error('Failed to create opportunity');
          this.isSaving = false;
        }
      });
    }
  }

  openDetailsModal(opportunity: Opportunity): void {
    this.selectedOpportunity = opportunity;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedOpportunity = null;
  }

  handleOpportunityStatusChanged(updatedOpportunity: Opportunity): void {
    // Update the opportunity in the local array
    const index = this.opportunities.findIndex(o => o.id === updatedOpportunity.id);
    if (index !== -1) {
      this.opportunities[index] = updatedOpportunity;
      this.filterOpportunities();
    }
  }

  handleOrderCreated(created: boolean): void {
    if (created && this.selectedOpportunity) {
      // Remove the opportunity from the list since it's now an order
      const index = this.opportunities.findIndex(o => o.id === this.selectedOpportunity?.id);
      if (index !== -1) {
        this.opportunities.splice(index, 1);
        this.filterOpportunities();
      }
      this.selectedOpportunity = null;
    }
  }

  // Toggle a status in the filter
  toggleStatusFilter(status: 'New' | 'In Progress' | 'Won' | 'Lost'): void {
    if (this.activeStatuses.has(status)) {
      this.activeStatuses.delete(status);
    } else {
      this.activeStatuses.add(status);
    }
    this.filterOpportunities();
  }

  // Check if a status is active
  isStatusActive(status: string): boolean {
    return this.activeStatuses.has(status);
  }

  // Set all statuses
  showAllStatuses(): void {
    this.activeStatuses = new Set(['New', 'In Progress', 'Won', 'Lost']);
    this.filterOpportunities();
  }
}