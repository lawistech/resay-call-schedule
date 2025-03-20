// src/app/features/dashboard/components/todays-scheduled-calls/todays-scheduled-calls.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Call } from '../../../../core/models/call.model';
import { format } from 'date-fns';

@Component({
  selector: 'app-todays-scheduled-calls',
  templateUrl: './todays-scheduled-calls.component.html'
})
export class TodaysScheduledCallsComponent implements OnInit {
  @Input() calls: Call[] = [];
  @Input() maxCalls: number = 5;
  @Output() viewCallDetails = new EventEmitter<string>();
  @Output() initiateCall = new EventEmitter<Call>();
  @Output() rescheduleCall = new EventEmitter<Call>(); // New output for rescheduling
  
  constructor() {}

  ngOnInit(): void {}

  // Get only today's scheduled calls, limited by maxCalls
  get todaysScheduledCalls(): Call[] {
    return this.calls.slice(0, this.maxCalls);
  }

  formatTime(date: string): string {
    return format(new Date(date), 'h:mm a');
  }

  onViewCallDetails(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.viewCallDetails.emit(callId);
  }

  onInitiateCall(call: Call, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.initiateCall.emit(call);
  }

  // New method for rescheduling calls
  onRescheduleCall(call: Call, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.rescheduleCall.emit(call);
  }
}