import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CallActiveGuard } from './core/guards/call-active.guard';
import { TaskBoardComponent } from './features/tasks/task-board/task-board.component';
import { LeadsComponent } from './features/leads/leads.component';
import { OpportunitiesComponent } from './features/opportunities/opportunities.component';

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
    path: 'settings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule)
  },
  {
    path: 'tasks',
    component: TaskBoardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'leads',
    component: LeadsComponent,
    canActivate: [AuthGuard],
  },
  // Direct component loading (simplified approach)
  {
    path: 'opportunities',
    component: OpportunitiesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];