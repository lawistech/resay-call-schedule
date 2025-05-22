// src/app/features/dashboard/dashboard.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { DashboardComponent } from './dashboard.component';
import { CallStatsComponent } from './components/call-stats/call-stats.component';
import { RecentCallsComponent } from './components/recent-calls/recent-calls.component';
import { UpcomingCallsComponent } from './components/upcoming-calls/upcoming-calls.component';
import { ContactScheduleComponent } from './components/contact-schedule/contact-schedule.component';
import { TodaysScheduledCallsComponent } from './components/todays-scheduled-calls/todays-scheduled-calls.component';
import { LeadSourceCallsComponent } from './components/lead-source-calls/lead-source-calls.component';
import { QuotationDetailsModalComponent } from '../quotations/quotation-details-modal/quotation-details-modal.component';

const routes: Routes = [
  { path: '', component: DashboardComponent }
];

@NgModule({
  declarations: [
    DashboardComponent,
    CallStatsComponent,
    RecentCallsComponent,
    UpcomingCallsComponent,
    ContactScheduleComponent,
    TodaysScheduledCallsComponent,
    LeadSourceCallsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    QuotationDetailsModalComponent
  ],
  exports:[
    DashboardComponent
  ]
})
export class DashboardModule { }