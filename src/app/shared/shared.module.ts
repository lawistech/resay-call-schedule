// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CallModalComponent } from './call-modal/call-modal.component';
import { PostCallModalComponent } from './post-call-modal/post-call-modal.component';
import { RescheduleModal } from './reschedule/reschedule-modal.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';

@NgModule({
  declarations: [
    // Other shared components
    CallModalComponent,
    PostCallModalComponent,
    RescheduleModal,
    ConfirmationDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CallModalComponent,
    PostCallModalComponent,
    RescheduleModal,
    ConfirmationDialogComponent
  ]
})
export class SharedModule { }