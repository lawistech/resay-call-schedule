// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { DateUtilsService } from './core/services/date-utils.service';
import { ReminderService } from './core/services/reminder.service';

// Function to initialize app settings
function initializeApp(dateUtils: DateUtilsService, reminderService: ReminderService) {
  return () => {
    // Set default timezone to UK
    const defaultTimezone = 'Europe/London';
    dateUtils.setAppTimezone(defaultTimezone);
    reminderService.setTimezone(defaultTimezone);
    console.log('App initialized with timezone:', defaultTimezone);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: (dateUtils: DateUtilsService, reminderService: ReminderService) => 
        initializeApp(dateUtils, reminderService),
      deps: [DateUtilsService, ReminderService],
      multi: true
    }
  ]
};