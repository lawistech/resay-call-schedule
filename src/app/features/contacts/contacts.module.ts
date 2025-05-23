// src/app/features/contacts/contacts.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { ContactDetailComponent } from './contact-detail/contact-detail.component';
import { ContactFormComponent } from './contact-form/contact-form.component';
import { ContactImportComponent } from './contact-import/contact-import.component'; // Add this
import { ContactQuotationsComponent } from './contact-quotations/contact-quotations.component';
import { ContactCommunicationComponent } from './contact-communication/contact-communication.component';
import { QuotationDetailsModalComponent } from '../quotations/quotation-details-modal/quotation-details-modal.component';
import { QuotationFormComponent } from '../quotations/quotation-form/quotation-form.component';
import { CompanyService } from '../companies/services/company.service';
import { CompanyRefreshService } from '../companies/services/company-refresh.service';
import { SharedModule } from '../../shared/shared.module';
import { ClipboardModule } from '@angular/cdk/clipboard';

const routes: Routes = [
  { path: '', component: ContactsListComponent },
  { path: 'add-contact', component: ContactFormComponent },
  { path: ':id', component: ContactDetailComponent }
];

@NgModule({
  declarations: [
    ContactsListComponent,
    ContactDetailComponent,
    ContactFormComponent,
    ContactImportComponent,
    ContactQuotationsComponent,
    ContactCommunicationComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ClipboardModule,
    QuotationDetailsModalComponent,
    QuotationFormComponent,
    RouterModule.forChild(routes)
  ],
  providers: [
    CompanyService,
    CompanyRefreshService
  ]
})
export class ContactsModule { }