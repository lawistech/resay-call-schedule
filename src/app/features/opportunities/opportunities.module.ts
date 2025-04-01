import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouterModule } from '@angular/router';

import { OpportunitiesComponent } from './opportunities.component';
import { PipelineKanbanComponent } from './pipeline-kanban/pipeline-kanban.component';
import { OpportunityFormComponent } from './opportunity-form/opportunity-form.component';
import { OpportunityDetailsModalComponent } from './opportunity-details-modal/opportunity-details-modal.component';

@NgModule({
  declarations: [
    OpportunitiesComponent,
    PipelineKanbanComponent,
    OpportunityFormComponent,
    OpportunityDetailsModalComponent // Moved from imports to declarations
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule.forChild([
      {
        path: '',
        component: OpportunitiesComponent
      }
    ])
  ],
  providers: [
    DatePipe,
    CurrencyPipe
  ]
})
export class OpportunitiesModule { }