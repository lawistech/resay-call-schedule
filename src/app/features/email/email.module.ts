// src/app/features/email/email.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  EmailDashboardComponent,
  EmailTemplatesComponent,
  EmailTemplateFormComponent,
  EmailTemplateDetailComponent
} from './components';

const routes: Routes = [
  { path: '', component: EmailDashboardComponent },
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
    EmailTemplateDetailComponent
  ]
})
export class EmailModule { }
