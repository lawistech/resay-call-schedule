import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService, Opportunity } from './opportunities.service';
import { OpportunityFormComponent } from './opportunity-form/opportunity-form.component';
import { OpportunityDetailsModalComponent } from './opportunity-details-modal/opportunity-details-modal.component';
// Removed duplicate import { filter } from 'rxjs'; 

@Component({
  selector: 'app-opportunities',
  templateUrl: './opportunities.component.html',
  // Corrected styles array syntax
  styles: [` 
    :host { display: block; }
  `]
})
export class OpportunitiesComponent implements OnInit {
  opportunities: Opportunity[] = []; // Typed array
  filteredOpportunities: Opportunity[] = []; // Typed array
  statusFilter: string = '';
  searchTerm: string = '';
  showOpportunityForm: boolean = false;
  selectedOpportunity: Opportunity | null = null; // Use null for object types
  showDetailsModal: boolean = false;
  isSaving: boolean = false;

  constructor(
    private opportunitiesService: OpportunitiesService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.opportunitiesService.getOpportunities().subscribe(
      opportunities => {
        this.opportunities = opportunities;
        this.filteredOpportunities = [...opportunities]; // Use spread to create a new array instance
      },
      error => console.error('Error fetching opportunities:', error) // Added basic error handling
    );
  }

  getStatusClass(status: Opportunity['status']): string {
    // Added whitespace-nowrap and flex-shrink-0 to match template usage
    const baseClasses = 'px-2.5 py-1 text-xs font-medium rounded-full'; 
    switch (status) {
      case 'New':
        return `${baseClasses} bg-blue-100 text-blue-800`; // Consistent with list view
      case 'In Progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`; // Consistent with list view
      case 'Won':
        return `${baseClasses} bg-green-100 text-green-800`; // Consistent with list view
      case 'Lost':
        return `${baseClasses} bg-red-100 text-red-800`; // Consistent with list view
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`; // Default fallback style
    } 
  }

  filterOpportunities(): void {
    let filtered = this.opportunities;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(opportunity =>
        (opportunity.title?.toLowerCase() || '').includes(term) || // Added null checks
        (opportunity.description?.toLowerCase() || '').includes(term)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(opportunity => opportunity.status === this.statusFilter);
    }

    this.filteredOpportunities = filtered;
  }

  // Modified to handle editing
  openOpportunityForm(opportunity?: Opportunity): void { // Made parameter optional
    this.selectedOpportunity = opportunity ?? null; // Assign null if opportunity is undefined
    this.showOpportunityForm = true;
  }

  closeOpportunityForm(): void {
    this.showOpportunityForm = false;
    this.selectedOpportunity = null; // Clear selected opportunity when closing form
  }

  // Renamed and modified to handle both create and update
  handleSaveOpportunity(opportunityData: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'> | Opportunity): void {
    if ('id' in opportunityData && opportunityData.id) {
      // Update existing opportunity - Assuming service takes ID and payload
      const { id, ...updatePayload } = opportunityData; 
      // Ensure updatePayload matches what the service expects, Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>
      this.opportunitiesService.updateOpportunity(id, updatePayload as Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: updatedOpportunity => {
          // Ensure updatedOpportunity is returned from the service call
          if (updatedOpportunity) {
            const index = this.opportunities.findIndex(o => o.id === updatedOpportunity.id);
            if (index !== -1) {
              this.opportunities[index] = updatedOpportunity;
              this.filterOpportunities(); // Refresh the filtered list
            }
          } else {
             console.error('Update successful but no opportunity data returned');
             // Optionally refetch all opportunities
          }
        },
        error: err => console.error('Error updating opportunity:', err)
      });
    } else {
      // Create new opportunity
      this.opportunitiesService.addOpportunity(opportunityData as Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: newOpportunity => {
           if (newOpportunity) { // Check if service returns the new opportunity
             this.opportunities.push(newOpportunity);
             this.filterOpportunities(); // Refresh the filtered list
           } else {
             console.error('Add successful but no opportunity data returned');
             // Optionally refetch all opportunities
           }
        },
        error: err => console.error('Error adding opportunity:', err)
      });
    }
    this.closeOpportunityForm(); // Close form after saving
  }

  openDetailsModal(opportunity: Opportunity): void { // Typed parameter
    this.selectedOpportunity = opportunity;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.selectedOpportunity = null; // Clear selected opportunity
    this.showDetailsModal = false;
  }
}
