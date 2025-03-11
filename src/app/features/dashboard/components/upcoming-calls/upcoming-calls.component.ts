// src/app/features/dashboard/components/upcoming-calls/upcoming-calls.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Call } from '../../../../core/models/call.model';
import { ReminderService } from '../../../../core/services/reminder.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-upcoming-calls',
  templateUrl: './upcoming-calls.component.html'
})
export class UpcomingCallsComponent implements OnInit {
  @Input() calls: Call[] = [];
  @Input() maxCalls: number = 5;
  @Output() completeCall = new EventEmitter<string>();
  @Output() initiateCallEvent = new EventEmitter<Call>();
  
  constructor(private reminderService: ReminderService) {}

  ngOnInit(): void {}

  // Get only upcoming scheduled calls, limited by maxCalls
  get upcomingCalls(): Call[] {
    return this.calls
      .filter(call => call.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, this.maxCalls);
  }

  formatTime(date: string): string {
    // Use the reminder service to format in the correct timezone
    return this.reminderService.formatDateToAppTimezone(date, 'h:mm a');
  }

  formatDate(date: string): string {
    const today = new Date();
    const callDate = new Date(date);
    
    // Today
    if (callDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (callDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // This week - use timezone-aware formatting
    return this.reminderService.formatDateToAppTimezone(date, 'EEEE'); // Day name (Monday, Tuesday, etc.)
  }

  // Method for marking a call as complete
  markAsCompleted(callId: string): void {
    this.completeCall.emit(callId);
  }

  // Method for initiating a call
  initiateCall(call: Call): void {
    this.initiateCallEvent.emit(call);
  }
}