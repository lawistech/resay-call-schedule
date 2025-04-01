// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CallActiveGuard } from './core/guards/call-active.guard';
import { TaskBoardComponent } from './features/tasks/task-board/task-board.component';
import { LeadsComponent } from './features/leads/leads.component';
import { OpportunitiesComponent } from './features/opportunities/opportunities.component';
import { PipelineKanbanComponent } from './features/opportunities/pipeline-kanban/pipeline-kanban.component';

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
  {
    path: 'opportunities',
    component: OpportunitiesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'pipeline',
    component: PipelineKanbanComponent,
    canActivate: [AuthGuard]
  },
  // Ecommerce routes
  // {
  //   path: 'products',
  //   canActivate: [AuthGuard],
  //   loadChildren: () => import('./features/ecommerce/products/products.module').then(m => m.ProductsModule)
  // },
  // {
  //   path: 'categories',
  //   canActivate: [AuthGuard],
  //   loadChildren: () => import('./features/ecommerce/categories/categories.module').then(m => m.CategoriesModule)
  // },
  // {
  //   path: 'orders',
  //   canActivate: [AuthGuard],
  //   loadChildren: () => import('./features/ecommerce/orders/orders.module').then(m => m.OrdersModule)
  // },
  // {
  //   path: 'inventory',
  //   canActivate: [AuthGuard],
  //   loadChildren: () => import('./features/ecommerce/inventory/inventory.module').then(m => m.InventoryModule)
  // },
  // {
  //   path: 'discounts',
  //   canActivate: [AuthGuard],
  //   loadChildren: () => import('./features/ecommerce/discounts/discounts.module').then(m => m.DiscountsModule)
  // },
  // {
  //   path: 'customers',
  //   canActivate: [AuthGuard],
  //   loadChildren: () => import('./features/ecommerce/customers/customers.module').then(m => m.CustomersModule)
  // },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];