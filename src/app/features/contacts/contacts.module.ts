// src/app/features/contacts/contacts.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { ContactDetailComponent } from './contact-detail/contact-detail.component';
import { ContactFormComponent } from './contact-form/contact-form.component';
import { ContactImportComponent } from './contact-import/contact-import.component'; // Add this
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
  ],
  imports: [
    CommonModule,
    SharedModule,
    ClipboardModule,
    RouterModule.forChild(routes)
  ]
})
export class ContactsModule { }