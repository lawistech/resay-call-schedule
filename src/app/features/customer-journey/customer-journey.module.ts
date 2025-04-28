// src/app/features/customer-journey/customer-journey.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { DecimalPipe, DatePipe } from '@angular/common';

import {
  CustomerJourneyComponent,
  JourneyVisualizationComponent,
  TouchpointDetailsComponent,
  JourneyAnalyticsComponent
} from './index';

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
  providers: [
    DatePipe,
    DecimalPipe
  ],
  exports: [
    CustomerJourneyComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class CustomerJourneyModule { }
