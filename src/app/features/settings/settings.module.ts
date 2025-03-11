// src/app/features/settings/settings.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { SettingsComponent } from './settings.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';

const routes: Routes = [
  { 
    path: '', 
    component: SettingsComponent,
    children: [
      { path: '', redirectTo: 'system', pathMatch: 'full' },
      { path: 'profile', component: ProfileSettingsComponent },
      { path: 'system', component: SystemSettingsComponent }
    ]
  }
];

@NgModule({
  declarations: [
    SettingsComponent,
    ProfileSettingsComponent,
    SystemSettingsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class SettingsModule { }