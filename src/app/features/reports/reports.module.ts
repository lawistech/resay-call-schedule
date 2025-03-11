// src/app/features/reports/reports.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ReportsComponent } from './reports.component';
import { CallReportComponent } from './call-report/call-report.component';
import { PerformanceReportComponent } from './performance-report/performance-report.component';

const routes: Routes = [
  { path: '', component: ReportsComponent }
];

@NgModule({
  declarations: [
    ReportsComponent,
    CallReportComponent,
    PerformanceReportComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ReportsModule { }