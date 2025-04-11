// src/app/features/email/email.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmailDashboardComponent } from './components';
import { EmailInboxComponent } from './email-inbox/email-inbox.component';
import { EmailComposeComponent } from './email-compose/email-compose.component';
import { EmailAccountSettingsComponent } from './email-accounts/email-account-settings.component';

const routes: Routes = [
  { path: '', component: EmailDashboardComponent },
  { path: 'inbox', component: EmailInboxComponent },
  { path: 'compose', component: EmailComposeComponent },
  { path: 'accounts/settings', component: EmailAccountSettingsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class EmailModule { }
