// src/app/features/email/email.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  EmailDashboardComponent,
  EmailTemplatesComponent,
  EmailTemplateFormComponent,
  EmailTemplateDetailComponent
} from './components';
import { EmailInboxComponent } from './email-inbox/email-inbox.component';
import { EmailComposeComponent } from './email-compose/email-compose.component';
import { EmailAccountSettingsComponent } from './email-accounts/email-account-settings.component';

const routes: Routes = [
  { path: '', component: EmailDashboardComponent },
  { path: 'inbox', component: EmailInboxComponent },
  { path: 'compose', component: EmailComposeComponent },
  { path: 'accounts/settings', component: EmailAccountSettingsComponent },
  { path: 'templates', component: EmailTemplatesComponent },
  { path: 'templates/new', component: EmailTemplateFormComponent },
  { path: 'templates/:id', component: EmailTemplateDetailComponent },
  { path: 'templates/:id/edit', component: EmailTemplateFormComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    EmailDashboardComponent,
    EmailTemplatesComponent,
    EmailTemplateFormComponent,
    EmailTemplateDetailComponent,
    EmailInboxComponent,
    EmailComposeComponent,
    EmailAccountSettingsComponent
  ]
})
export class EmailModule { }
