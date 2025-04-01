import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Opportunity } from '../../../core/models/company.model';
import { OpportunitiesService } from '../opportunities.service';

@Component({
  selector: 'app-pipeline-kanban',
  templateUrl: './pipeline-kanban.component.html',
  styleUrls: ['./pipeline-kanban.component.css']
})
export class PipelineKanbanComponent implements OnInit {
  stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed-Won'];
  opportunitiesByStage: { [key: string]: Opportunity[] } = {};

  constructor(private opportunitiesService: OpportunitiesService) { }

  ngOnInit(): void {
    this.loadOpportunities();
  }

  private loadOpportunities(): void {
    this.opportunitiesService.getOpportunities().subscribe(opportunities => {
      this.stages.forEach(stage => {
        this.opportunitiesByStage[stage] = opportunities.filter(opp => opp.stage === stage);
      });
    });
  }

  drop(event: CdkDragDrop<Opportunity[]>) {
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
      const previousStage = event.previousContainer.id;
      const previousIndex = event.previousIndex;
      
      opportunity.stage = event.container.id;
      this.opportunitiesService.updateOpportunity(opportunity.id, opportunity).subscribe(
        () => {}, // Success handler
        (err: HttpErrorResponse) => {
          // Revert UI changes on error
          opportunity.stage = previousStage;
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            previousIndex
          );
        }
      );
    }
  }

  getConnectedLists(): string[] {
    return this.stages;
  }
}
