// src/app/features/reports/performance-report/performance-report.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Call } from '../../../core/models/call.model';

interface UserPerformance {
  userId: string;
  userName: string;
  totalCalls: number;
  completedCalls: number;
  completionRate: number;
  averageDuration: number;
  missedCalls: number;
}

@Component({
  selector: 'app-performance-report',
  templateUrl: './performance-report.component.html',
  //styleUrls: ['./performance-report.component.css']
})
export class PerformanceReportComponent implements OnChanges {
  @Input() calls: Call[] = [];
  
  userPerformance: UserPerformance[] = [];
  sortField: keyof UserPerformance = 'totalCalls';
  sortDirection = 'desc';

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['calls']) {
      this.calculatePerformance();
    }
  }

  calculatePerformance(): void {
    // Group calls by user
    const userCalls: {[key: string]: Call[]} = {};
    
    this.calls.forEach(call => {
      if (call.user_id) {
        if (!userCalls[call.user_id]) {
          userCalls[call.user_id] = [];
        }
        userCalls[call.user_id].push(call);
      }
    });
    
    // Calculate performance metrics for each user
    this.userPerformance = Object.entries(userCalls).map(([userId, calls]) => {
      const completedCalls = calls.filter(call => call.status === 'completed');
      const missedCalls = calls.filter(call => call.status === 'missed');
      const callsWithDuration = completedCalls.filter(call => call.duration_minutes && call.duration_minutes > 0);
      const totalDuration = callsWithDuration.reduce((sum, call) => sum + (call.duration_minutes || 0), 0);
      
      return {
        userId,
        userName: `User ${userId.substring(0, 4)}`, // In a real app, fetch actual user names
        totalCalls: calls.length,
        completedCalls: completedCalls.length,
        completionRate: calls.length > 0 ? Math.round((completedCalls.length / calls.length) * 100) : 0,
        averageDuration: callsWithDuration.length > 0 ? Math.round(totalDuration / callsWithDuration.length) : 0,
        missedCalls: missedCalls.length
      };
    });
    
    this.sortPerformance(this.sortField);
  }

  sortPerformance(field: keyof UserPerformance): void {
    // If clicking the same field, toggle direction
    if (field === this.sortField) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc'; // Default to descending for new field
    }
    
    this.userPerformance.sort((a, b) => {
      const valueA = a[field];
      const valueB = b[field];
      
      // Handle string vs number comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        return this.sortDirection === 'asc' 
          ? Number(valueA) - Number(valueB) 
          : Number(valueB) - Number(valueA);
      }
    });
  }
}