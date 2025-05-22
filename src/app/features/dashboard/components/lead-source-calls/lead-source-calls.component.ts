// src/app/features/dashboard/components/lead-source-calls/lead-source-calls.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Call } from '../../../../core/models/call.model';
import { format } from 'date-fns';

@Component({
  selector: 'app-lead-source-calls',
  templateUrl: './lead-source-calls.component.html'
})
export class LeadSourceCallsComponent implements OnInit {
  @Input() calls: Call[] = [];
  @Input() maxCalls: number = 5;
  @Input() leadSource: string = '';
  @Input() title: string = 'Calls';
  
  @Output() viewCallDetails = new EventEmitter<string>();
  @Output() initiateCall = new EventEmitter<Call>();
  @Output() rescheduleCall = new EventEmitter<Call>();
  @Output() completeCall = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  // Get filtered calls by lead source, limited by maxCalls
  get filteredCalls(): Call[] {
    let filtered = this.calls;
    
    // Filter by lead source if specified
    if (this.leadSource) {
      filtered = filtered.filter(call => call.lead_source === this.leadSource);
    }
    
    return filtered.slice(0, this.maxCalls);
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

  onRescheduleCall(call: Call, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.rescheduleCall.emit(call);
  }

  onCompleteCall(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.completeCall.emit(callId);
  }
}
