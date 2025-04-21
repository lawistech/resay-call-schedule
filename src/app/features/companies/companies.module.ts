// src/app/features/companies/companies.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';

import { CompaniesListComponent } from './companies-list/companies-list.component';
import { CompanyDetailComponent } from './company-detail/company-detail.component';
import { CompanyFormComponent } from './company-form/company-form.component';
import { CompanyService } from './services/company.service';
import { CompanyPeopleComponent } from './company-detail/company-people/company-people.component';
import { CompanyCommunicationComponent } from './company-detail/company-communication/company-communication.component';
import { CompanyOpportunitiesComponent } from './company-detail/company-opportunities/company-opportunities.component';
import { CompanyActiveQuotationsComponent } from './company-detail/company-active-quotations/company-active-quotations.component';
import { OpportunitySuccessModalComponent } from '../opportunities/opportunity-success-modal/opportunity-success-modal.component';
import { QuotationService } from '../quotations/services/quotation.service';
import { QuotationDetailsModalComponent } from '../quotations/quotation-details-modal/quotation-details-modal.component';

const routes: Routes = [
  { path: '', component: CompaniesListComponent },
  { path: 'new', component: CompanyFormComponent },
  { path: ':id', component: CompanyDetailComponent },
  { path: ':id/edit', component: CompanyFormComponent }
];

@NgModule({
  declarations: [
    CompaniesListComponent,
    CompanyDetailComponent,
    CompanyFormComponent,
    CompanyPeopleComponent,
    CompanyCommunicationComponent,
    CompanyOpportunitiesComponent,
    CompanyActiveQuotationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule, // This includes CallModalComponent
    HttpClientModule,
    RouterModule.forChild(routes),
    OpportunitySuccessModalComponent,
    QuotationDetailsModalComponent
  ],
  providers: [
    CompanyService,
    QuotationService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CompaniesModule { }
