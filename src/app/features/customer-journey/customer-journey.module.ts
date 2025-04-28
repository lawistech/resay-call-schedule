// src/app/features/customer-journey/customer-journey.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

import { CustomerJourneyComponent } from './customer-journey.component';
import { JourneyVisualizationComponent } from './components/journey-visualization/journey-visualization.component';
import { TouchpointDetailsComponent } from './components/touchpoint-details/touchpoint-details.component';
import { JourneyAnalyticsComponent } from './components/journey-analytics/journey-analytics.component';

const routes: Routes = [
  { path: '', component: CustomerJourneyComponent }
];

@NgModule({
  declarations: [
    CustomerJourneyComponent,
    JourneyVisualizationComponent,
    TouchpointDetailsComponent,
    JourneyAnalyticsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    CustomerJourneyComponent
  ]
})
export class CustomerJourneyModule { }
