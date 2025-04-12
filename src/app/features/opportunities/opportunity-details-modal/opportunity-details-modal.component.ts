import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Opportunity } from '../../../core/models/company.model';
import { OpportunitiesService } from '../opportunities.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OpportunityHistoryService } from '../opportunity-history.service';
import { OpportunityHistory } from '../../../core/models/opportunity-history.model';
import { OpportunitySuccessModalComponent } from '../opportunity-success-modal/opportunity-success-modal.component';
import { OrderService } from '../../orders/order.service';

@Component({
  selector: 'app-opportunity-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, OpportunitySuccessModalComponent],
  templateUrl: './opportunity-details-modal.component.html',
  styleUrls: ['./opportunity-details-modal.component.css']
})
export class OpportunityDetailsModalComponent implements OnChanges {
  @Input() show: boolean = false;
  @Input() opportunity: Opportunity | null = null;
  @Output() closeEvent = new EventEmitter<boolean>();
  @Output() statusChanged = new EventEmitter<Opportunity>();
  @Output() orderCreated = new EventEmitter<boolean>();

  statuses: Array<'New' | 'In Progress' | 'Won' | 'Lost'> = ['New', 'In Progress', 'Won', 'Lost'];
  stages: Array<'Prospecting' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed-Won'> = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed-Won'];
  isUpdating = false;
  showHistory = false;
  historyEntries: OpportunityHistory[] = [];
  isLoadingHistory = false;

  // Dropdown toggles
  showStatusDropdown = false;
  showStageDropdown = false;

  // Success modal
  showSuccessModal = false;

  constructor(
    private opportunitiesService: OpportunitiesService,
    private notificationService: NotificationService,
    private opportunityHistoryService: OpportunityHistoryService,
    private orderService: OrderService
  ) {}

  close() {
    this.closeEvent.emit(false);
  }

  toggleStatusDropdown() {
    this.showStatusDropdown = !this.showStatusDropdown;
    // Close the other dropdown if it's open
    if (this.showStatusDropdown) {
      this.showStageDropdown = false;
    }
  }

  toggleStageDropdown() {
    this.showStageDropdown = !this.showStageDropdown;
    // Close the other dropdown if it's open
    if (this.showStageDropdown) {
      this.showStatusDropdown = false;
    }
  }

  updateStatus(status: 'New' | 'In Progress' | 'Won' | 'Lost') {
    if (!this.opportunity || this.isUpdating) return;

    // Close the dropdown
    this.showStatusDropdown = false;

    this.isUpdating = true;
    const updatedOpportunity = { ...this.opportunity, status };

    // If status is Won and stage is not Closed-Won, update stage too
    if (status === 'Won' && updatedOpportunity.stage !== 'Closed-Won') {
      updatedOpportunity.stage = 'Closed-Won';
      updatedOpportunity.probability = 100;

      // Show success modal for Won opportunities
      this.opportunitiesService.updateOpportunity(this.opportunity.id, updatedOpportunity)
        .subscribe({
          next: (updated) => {
            this.opportunity = updated;
            this.notificationService.success(`Opportunity status updated to ${status}`);
            this.statusChanged.emit(updated);
            this.isUpdating = false;

            // Show success modal
            this.showSuccessModal = true;
          },
          error: (error) => {
            this.notificationService.error('Failed to update opportunity status');
            this.isUpdating = false;
          }
        });
      return;
    }

    // If status is Lost, set probability to 0
    if (status === 'Lost') {
      updatedOpportunity.probability = 0;
    }

    this.opportunitiesService.updateOpportunity(this.opportunity.id, updatedOpportunity)
      .subscribe({
        next: (updated) => {
          this.opportunity = updated;
          this.notificationService.success(`Opportunity status updated to ${status}`);
          this.statusChanged.emit(updated);
          this.isUpdating = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to update opportunity status');
          this.isUpdating = false;
        }
      });
  }

  updateStage(stage: 'Prospecting' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed-Won') {
    if (!this.opportunity || this.isUpdating) return;

    // Close the dropdown
    this.showStageDropdown = false;

    this.isUpdating = true;
    const updatedOpportunity = { ...this.opportunity, stage };

    // Auto-adjust probability based on stage
    let probability = 0;
    switch(stage) {
      case 'Prospecting': probability = 20; break;
      case 'Discovery': probability = 40; break;
      case 'Proposal': probability = 60; break;
      case 'Negotiation': probability = 80; break;
      case 'Closed-Won': probability = 100; break;
    }
    updatedOpportunity.probability = probability;

    // If stage is Closed-Won, auto-set status to Won
    if (stage === 'Closed-Won') {
      updatedOpportunity.status = 'Won';

      // Update opportunity first
      this.opportunitiesService.updateOpportunity(this.opportunity.id, updatedOpportunity)
        .subscribe({
          next: (updated) => {
            this.opportunity = updated;
            this.notificationService.success(`Opportunity stage updated to ${stage}`);
            this.statusChanged.emit(updated);
            this.isUpdating = false;

            // Show success modal for Closed-Won stage
            this.showSuccessModal = true;
          },
          error: (error) => {
            this.notificationService.error('Failed to update opportunity stage');
            this.isUpdating = false;
          }
        });
      return;
    }

    this.opportunitiesService.updateOpportunity(this.opportunity.id, updatedOpportunity)
      .subscribe({
        next: (updated) => {
          this.opportunity = updated;
          this.notificationService.success(`Opportunity stage updated to ${stage}`);
          this.statusChanged.emit(updated);
          this.isUpdating = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to update opportunity stage');
          this.isUpdating = false;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If opportunity changes and we have a valid opportunity, load its history
    if (changes['opportunity'] && this.opportunity && this.opportunity.id) {
      this.loadOpportunityHistory();
    }
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;

    // Load history if it's not already loaded
    if (this.showHistory && this.historyEntries.length === 0 && this.opportunity) {
      this.loadOpportunityHistory();
    }
  }

  loadOpportunityHistory(): void {
    if (!this.opportunity || !this.opportunity.id) return;

    this.isLoadingHistory = true;
    this.opportunityHistoryService.getOpportunityHistory(this.opportunity.id)
      .subscribe({
        next: (history) => {
          this.historyEntries = history;
          this.isLoadingHistory = false;
        },
        error: (error) => {
          console.error('Error loading opportunity history:', error);
          this.notificationService.error('Failed to load opportunity history');
          this.isLoadingHistory = false;
        }
      });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  // Success modal handlers
  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  handleSuccessSubmit(event: {opportunity: Opportunity, notes: string}) {
    if (!event.opportunity) return;

    // Create order from opportunity
    this.orderService.createOrderFromOpportunity(event.opportunity, event.notes)
      .subscribe({
        next: (order) => {
          this.notificationService.success('Order created successfully');
          this.closeSuccessModal();

          // Delete the opportunity after creating the order
          this.opportunitiesService.deleteOpportunity(event.opportunity.id)
            .subscribe({
              next: () => {
                console.log('Opportunity deleted after order creation');
                // Emit event to notify parent that an order was created and opportunity deleted
                this.orderCreated.emit(true);
                this.close(); // Close the opportunity details modal
              },
              error: (error) => {
                console.error('Error deleting opportunity:', error);
                // Still emit the order created event even if deletion fails
                this.orderCreated.emit(true);
                this.close();
              }
            });
        },
        error: (error) => {
          console.error('Error creating order:', error);
          this.notificationService.error('Failed to create order');
          this.isUpdating = false;
        }
      });
  }
}