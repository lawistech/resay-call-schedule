// src/app/core/services/reminder.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { Call } from '../models/call.model';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ReminderService implements OnDestroy {
  private checkInterval: Subscription;
  private reminderTimeMinutes = 5; // Default to 5 minute reminders
  private remindedCallIds: Set<string> = new Set();
  private appTimezone = 'Europe/London'; // Set this to UK timezone

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Check for upcoming calls every minute
    this.checkInterval = interval(60000).subscribe(() => this.checkUpcomingCalls());
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
    }
  }

  // Update reminder time from settings
  setReminderTime(minutes: number): void {
    this.reminderTimeMinutes = minutes;
  }

  // Get reminder time setting
  getReminderTime(): number {
    return this.reminderTimeMinutes;
  }

  // Set app timezone
  setTimezone(timezone: string): void {
    this.appTimezone = timezone;
  }

  // Get current app timezone
  getTimezone(): string {
    return this.appTimezone;
  }

  // Check for calls that are coming up within the reminder window
  async checkUpcomingCalls(): Promise<void> {
    try {
      // Get current time in the target timezone (UK)
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + this.reminderTimeMinutes * 60000);
      
      // Convert dates to ISO strings for comparison
      const nowIso = now.toISOString();
      const reminderWindowIso = reminderWindow.toISOString();
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('calls')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, phone)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_at', nowIso)
        .lte('scheduled_at', reminderWindowIso);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        this.processReminders(data as Call[]);
      }
    } catch (error: any) {
      console.error('Failed to check upcoming calls:', error.message);
    }
  }

  private processReminders(calls: Call[]): void {
    calls.forEach(call => {
      // Only send reminder once per call
      if (!this.remindedCallIds.has(call.id)) {
        const contactName = call.contact ? `${call.contact.first_name} ${call.contact.last_name}` : 'Unknown Contact';
        
        // Format the time in UK timezone
        const callTime = formatInTimeZone(
          parseISO(call.scheduled_at), 
          this.appTimezone, 
          'h:mm a'
        );
        
        const message = `You have a call with ${contactName} in ${this.reminderTimeMinutes} minutes at ${callTime}`;
        
        this.notificationService.reminder(message, {
          id: call.id,
          contactId: call.contact_id
        });
        
        // Mark this call as reminded
        this.remindedCallIds.add(call.id);
      }
    });
  }

  // Format a date to display in the app timezone
  formatDateToAppTimezone(dateString: string, formatString: string = 'h:mm a'): string {
    return formatInTimeZone(parseISO(dateString), this.appTimezone, formatString);
  }

  // Navigate to call detail or open call modal
  goToCall(callId: string): void {
    this.router.navigate(['/call-history', callId]);
  }

  // Reset reminded calls (useful when testing)
  resetReminders(): void {
    this.remindedCallIds.clear();
  }
}