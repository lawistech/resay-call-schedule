// src/app/features/call-history/call-history.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CallListComponent } from './call-list/call-list.component';
import { CallDetailComponent } from './call-detail/call-detail.component';
import { CallFormComponent } from './call-form/call-form.component';

const routes: Routes = [
  { path: '', component: CallListComponent },
  { path: ':id', component: CallDetailComponent }
];

@NgModule({
  declarations: [
    CallListComponent,
    CallDetailComponent,
    CallFormComponent
    // Remove CallModalComponent from here
  ],
  imports: [
    CommonModule,
    SharedModule, // This will provide access to CallModalComponent
    RouterModule.forChild(routes)
  ]
})
export class CallHistoryModule { }