// src/app/features/quotations/quotations.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuotationService } from './services/quotation.service';
import { CompanyService } from '../companies/services/company.service';

// Import the standalone components
import { QuotationFormComponent } from './quotation-form/quotation-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'new', pathMatch: 'full' },
  { path: 'new', component: QuotationFormComponent },
  { path: ':id', component: QuotationFormComponent },
  { path: ':id/edit', component: QuotationFormComponent }
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
