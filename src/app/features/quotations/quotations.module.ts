// src/app/features/quotations/quotations.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuotationService } from './services/quotation.service';
import { CompanyService } from '../companies/services/company.service';

// Import the standalone components
import { QuotationFormComponent } from './quotation-form/quotation-form.component';
import { QuotationsListComponent } from './quotations-list/quotations-list.component';
import { QuotationDetailsModalComponent } from './quotation-details-modal/quotation-details-modal.component';
import { QuotationFormPageComponent } from './quotation-form-page/quotation-form-page.component';

const routes: Routes = [
  { path: '', component: QuotationsListComponent },
  { path: 'new', component: QuotationFormPageComponent },
  { path: ':id', component: QuotationsListComponent },
  { path: ':id/edit', component: QuotationFormPageComponent }
];

@NgModule({
  declarations: [
    // No declarations needed for standalone components
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    QuotationService,
    CompanyService
  ]
})
export class QuotationsModule { }
