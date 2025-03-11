// src/app/features/dashboard/components/recent-calls/recent-calls.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Call } from '../../../../core/models/call.model';
import { formatDistance } from 'date-fns';

@Component({
  selector: 'app-recent-calls',
  templateUrl: './recent-calls.component.html'
})
export class RecentCallsComponent implements OnInit {
  @Input() calls: Call[] = [];
  @Input() maxCalls: number = 5;
  // Changed to emit a string to match the markCallAsCompleted parameter type
  @Output() completeCall = new EventEmitter<string>();
  
  constructor() {}

  ngOnInit(): void {}

  // Get only the most recent calls, limited by maxCalls
  get recentCalls(): Call[] {
    return this.calls
      .sort((a, b) => new Date(b.completed_at || b.scheduled_at).getTime() - 
                      new Date(a.completed_at || a.scheduled_at).getTime())
      .slice(0, this.maxCalls);
  }

  getTimeAgo(date: string): string {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  }

  // Method for marking a call as complete
  markAsCompleted(callId: string): void {
    this.completeCall.emit(callId);
  }
}