// src/app/core/services/date-utils.service.ts
import { Injectable } from '@angular/core';
import { parseISO, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {
  private appTimezone: string = 'Europe/London'; // Default to UK timezone

  constructor() {}

  setAppTimezone(timezone: string): void {
    this.appTimezone = timezone;
  }

  getAppTimezone(): string {
    return this.appTimezone;
  }

  formatToAppTimezone(date: string | Date, formatString: string = 'yyyy-MM-dd HH:mm'): string {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(parsedDate, this.appTimezone, formatString);
  }

  formatToLocalTimezone(date: string | Date, formatString: string = 'yyyy-MM-dd HH:mm'): string {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatString);
  }

  getCurrentTimeInAppTimezone(): Date {
    const now = new Date();
    // This is a simplification - properly handling this would require more complex timezone conversion
    return now;
  }

  isToday(date: string | Date): boolean {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    return (
      parsedDate.getDate() === today.getDate() &&
      parsedDate.getMonth() === today.getMonth() &&
      parsedDate.getFullYear() === today.getFullYear()
    );
  }

  isTomorrow(date: string | Date): boolean {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      parsedDate.getDate() === tomorrow.getDate() &&
      parsedDate.getMonth() === tomorrow.getMonth() &&
      parsedDate.getFullYear() === tomorrow.getFullYear()
    );
  }
}