// src/app/features/email/email.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
    RouterModule.forChild(routes),
    EmailDashboardComponent,
    EmailInboxComponent,
    EmailComposeComponent,
    EmailAccountSettingsComponent
  ]
})
export class EmailModule { }
