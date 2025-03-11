// src/app/features/settings/settings.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
 // styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  tabs = [
    { route: '/settings/system', label: 'System Settings' },
    { route: '/settings/profile', label: 'Profile Settings' }
  ];
}