// src/app/features/settings/system-settings/system-settings.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { ReminderService } from '../../../core/services/reminder.service';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html'
})
export class SystemSettingsComponent implements OnInit {
  systemForm!: FormGroup;
  notificationForm!: FormGroup;
  integrationsForm!: FormGroup;
  
  isUpdatingSystem = false;
  isUpdatingNotifications = false;
  isUpdatingIntegrations = false;

  // Common timezones for dropdown
  timezones = [
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Manila', label: 'Manila (PHT)' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private reminderService: ReminderService
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    // System preferences
    this.systemForm = this.formBuilder.group({
      default_call_method: ['phone'],
      business_hours_start: ['09:00'],
      business_hours_end: ['17:00'],
      time_zone: [this.reminderService.getTimezone()], // Get current timezone setting
      date_format: ['MM/DD/YYYY']
    });

    // Notification preferences
    this.notificationForm = this.formBuilder.group({
      email_notifications: [true],
      browser_notifications: [true],
      call_reminders: [true],
      reminder_time: [this.reminderService.getReminderTime().toString()] // Get current setting
    });

    // Integration settings
    this.integrationsForm = this.formBuilder.group({
      crm_integration: ['none'],
      calendar_integration: ['none'],
      webex_integration: [false],
      teams_integration: [false],
      zoom_integration: [false]
    });
  }

  saveSystemSettings(): void {
    this.isUpdatingSystem = true;
    
    // Update timezone setting
    const timezone = this.systemForm.get('time_zone')?.value;
    if (timezone) {
      this.reminderService.setTimezone(timezone);
    }
    
    setTimeout(() => {
      this.notificationService.success('System settings saved successfully');
      this.isUpdatingSystem = false;
    }, 1000);
  }

  saveNotificationSettings(): void {
    this.isUpdatingNotifications = true;
    
    // Update reminder time setting
    const reminderTime = parseInt(this.notificationForm.get('reminder_time')?.value || '15', 10);
    this.reminderService.setReminderTime(reminderTime);
    
    // Request notification permission if reminders are enabled
    if (this.notificationForm.get('browser_notifications')?.value) {
      this.notificationService.requestNotificationPermission();
    }
    
    setTimeout(() => {
      this.notificationService.success('Notification settings saved successfully');
      this.isUpdatingNotifications = false;
    }, 1000);
  }

  saveIntegrationSettings(): void {
    this.isUpdatingIntegrations = true;
    
    setTimeout(() => {
      this.notificationService.success('Integration settings saved successfully');
      this.isUpdatingIntegrations = false;
    }, 1000);
  }
}