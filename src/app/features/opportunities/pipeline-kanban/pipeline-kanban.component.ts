// src/app/features/opportunities/pipeline-kanban/pipeline-kanban.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Opportunity } from '../../../core/models/company.model';
import { OpportunitiesService } from '../opportunities.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pipeline-kanban',
  templateUrl: './pipeline-kanban.component.html',
  styleUrls: ['./pipeline-kanban.component.css'],
  standalone: true,
  imports: [CommonModule, DragDropModule, DatePipe, FormsModule]
})
export class PipelineKanbanComponent implements OnInit {
  stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed-Won'];
  opportunitiesByStage: { [key: string]: Opportunity[] } = {};
  isLoading = true;
  pipelineStats = {
    totalValue: 0,
    totalDeals: 0,
    avgDealSize: 0,
    winRate: 0
  };

  // Filtering options
  searchTerm: string = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;
  statusFilter: string = '';

  constructor(
    private opportunitiesService: OpportunitiesService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOpportunities();
  }

  private loadOpportunities(): void {
    this.isLoading = true;
    this.opportunitiesService.getOpportunities().subscribe({
      next: (opportunities) => {
        // Initialize empty arrays for each stage
        this.stages.forEach(stage => {
          this.opportunitiesByStage[stage] = [];
        });

        // Distribute opportunities to their respective stages
        opportunities.forEach(opp => {
          if (opp.stage && this.stages.includes(opp.stage)) {
            this.opportunitiesByStage[opp.stage].push(opp);
          } else {
            // If stage is invalid or undefined, default to Prospecting
            this.opportunitiesByStage['Prospecting'].push({
              ...opp,
              stage: 'Prospecting'
            });
          }
        });

        this.calculatePipelineStats(opportunities);
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load opportunities');
        console.error('Error loading opportunities:', error);
        this.isLoading = false;
      }
    });
  }

  drop(event: CdkDragDrop<Opportunity[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const opportunity = event.container.data[event.currentIndex];
      const newStage = event.container.id;
      const previousStage = event.previousContainer.id;
      const previousIndex = event.previousIndex;

      // Update opportunity stage
      opportunity.stage = newStage;

      // Auto-update status based on stage movement
      if (newStage === 'Closed-Won') {
        opportunity.status = 'Won';
        opportunity.probability = 100;
      } else if (previousStage === 'Closed-Won') {
        opportunity.status = 'In Progress';
      }

      // Auto-update probability based on stage
      switch(newStage) {
        case 'Prospecting': opportunity.probability = 20; break;
        case 'Discovery': opportunity.probability = 40; break;
        case 'Proposal': opportunity.probability = 60; break;
        case 'Negotiation': opportunity.probability = 80; break;
        case 'Closed-Won': opportunity.probability = 100; break;
      }

      this.opportunitiesService.updateOpportunity(opportunity.id, opportunity).subscribe({
        next: () => {
          this.notificationService.success(`Moved opportunity to ${newStage}`);
          // Recalculate pipeline stats after successful update
          this.calculatePipelineStats();
        },
        error: (err: HttpErrorResponse) => {
          this.notificationService.error('Failed to update opportunity stage');

          // Revert UI changes on error
          opportunity.stage = previousStage;
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            previousIndex
          );
        }
      });
    }
  }

  applyFilters(): void {
    this.loadOpportunities();
    /*
    Note: In a real implementation, we would apply filters here based on searchTerm,
    minAmount, maxAmount, and statusFilter. Since we're loading all data from the server
    and filtering client-side in this example, we'd filter the loaded opportunities.

    A more scalable approach would be to pass filter parameters to the server.
    */
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.minAmount = null;
    this.maxAmount = null;
    this.statusFilter = '';
    this.loadOpportunities();
  }

  getConnectedLists(): string[] {
    return this.stages;
  }

  getStageValue(stage: string): string {
    if (!this.opportunitiesByStage[stage]) return '0';

    const total = this.opportunitiesByStage[stage].reduce((sum, opp) => sum + (opp.amount || 0), 0);
    return total.toLocaleString();
  }

  calculatePipelineStats(opportunities?: Opportunity[]): void {
    // Use provided opportunities or gather them from all stages
    const allOpportunities = opportunities || Object.values(this.opportunitiesByStage).flat();

    // Calculate total value
    this.pipelineStats.totalValue = allOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

    // Calculate total deals
    this.pipelineStats.totalDeals = allOpportunities.length;

    // Calculate average deal size
    this.pipelineStats.avgDealSize = this.pipelineStats.totalDeals > 0
      ? this.pipelineStats.totalValue / this.pipelineStats.totalDeals
      : 0;

    // Calculate win rate (based on Won status vs Lost status)
    const wonDeals = allOpportunities.filter(opp => opp.status === 'Won').length;
    const closedDeals = allOpportunities.filter(opp => opp.status === 'Won' || opp.status === 'Lost').length;
    this.pipelineStats.winRate = closedDeals > 0
      ? (wonDeals / closedDeals) * 100
      : 0;
  }

  openOpportunityDetail(opportunity: Opportunity): void {
    // You can implement detailed view navigation here
    this.router.navigate(['/opportunities'], {
      queryParams: {
        action: 'view',
        id: opportunity.id
      }
    });
  }

  createNewOpportunity(): void {
    this.router.navigate(['/opportunities'], { queryParams: { action: 'new' } });
  }
}