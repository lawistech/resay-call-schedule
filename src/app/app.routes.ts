// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CallActiveGuard } from './core/guards/call-active.guard';
import { TaskBoardComponent } from './features/tasks/task-board/task-board.component';
import { MyTasksComponent } from './features/tasks/my-tasks/my-tasks.component';
import { TaskCalendarPageComponent } from './features/tasks/task-calendar-page/task-calendar-page.component';
import { TeamTasksComponent } from './features/tasks/team-tasks/team-tasks.component'; // Importing the new TeamTasksComponent
import { LeadsComponent } from './features/leads/leads.component';
import { OpportunitiesComponent } from './features/opportunities/opportunities.component';
import { PipelineKanbanComponent } from './features/opportunities/pipeline-kanban/pipeline-kanban.component';
import { OpportunityFormPageComponent } from './features/opportunities/opportunity-form-page/opportunity-form-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'contacts',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/contacts/contacts.module').then(m => m.ContactsModule)
  },
  {
    path: 'call-history',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/call-history/call-history.module').then(m => m.CallHistoryModule)
  },
  {
    path: 'schedule',
    canDeactivate: [CallActiveGuard],
    loadChildren: () => import('./features/schedule/schedule.module').then(m => m.ScheduleModule)
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
  },
  {
    path: 'email',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/email/email.module').then(m => m.EmailModule)
  },
  {
    path: 'ecommerce',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/ecommerce/ecommerce.module').then(m => m.EcommerceModule)
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule)
  },
  {
    path: 'companies',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/companies/companies.module').then(m => m.CompaniesModule)
  },
  {
    path: 'tasks',
    children: [
      {
        path: '',
        component: TaskBoardComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'my-tasks',
        component: MyTasksComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'team-tasks',
        component: TeamTasksComponent, // Using our new dedicated TeamTasksComponent
        canActivate: [AuthGuard]
      },
      {
        path: 'calendar',
        component: TaskCalendarPageComponent, // Using our new dedicated component
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: 'leads',
    component: LeadsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'opportunities',
    component: OpportunitiesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'opportunities/new',
    component: OpportunityFormPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'opportunities/:id/edit',
    component: OpportunityFormPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'pipeline',
    component: PipelineKanbanComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'quotations',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/quotations/quotations.module').then(m => m.QuotationsModule)
  },
  {
    path: 'customer-journey',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/customer-journey/customer-journey.module').then(m => m.CustomerJourneyModule)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];