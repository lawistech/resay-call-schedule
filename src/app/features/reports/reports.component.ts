// src/app/features/reports/reports.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { Call } from '../../core/models/call.model';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
 // styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  calls: Call[] = [];
  isLoading = true;
  
  // Report date range
  dateRange = {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
    end: new Date().toISOString().split('T')[0] // Today
  };
  
  // Report metrics
  metrics = {
    totalCalls: 0,
    completedCalls: 0,
    missedCalls: 0,
    completionRate: 0,
    averageDuration: 0
  };
  
  // Report data for charts
  callsByStatus: any[] = [];
  callsByMethod: any[] = [];
  callsByDay: any[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  async loadReportData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Fetch calls within the date range
      const { data, error } = await this.supabaseService.supabaseClient
        .from('calls')
        .select('*, contacts(*)')
        .gte('scheduled_at', `${this.dateRange.start}T00:00:00`)
        .lte('scheduled_at', `${this.dateRange.end}T23:59:59`);
      
      if (error) {
        throw error;
      }
      
      this.calls = data || [];
      this.calculateMetrics();
      this.prepareChartData();
      
    } catch (error: any) {
      this.notificationService.error('Failed to load report data: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  calculateMetrics(): void {
    // Total calls
    this.metrics.totalCalls = this.calls.length;
    
    // Completed calls
    const completedCalls = this.calls.filter(call => call.status === 'completed');
    this.metrics.completedCalls = completedCalls.length;
    
    // Missed calls
    this.metrics.missedCalls = this.calls.filter(call => call.status === 'missed').length;
    
    // Completion rate
    this.metrics.completionRate = this.metrics.totalCalls > 0 
      ? Math.round((this.metrics.completedCalls / this.metrics.totalCalls) * 100) 
      : 0;
    
    // Average duration for completed calls with duration
    const callsWithDuration = completedCalls.filter(call => call.duration_minutes && call.duration_minutes > 0);
    const totalDuration = callsWithDuration.reduce((sum, call) => sum + (call.duration_minutes || 0), 0);
    this.metrics.averageDuration = callsWithDuration.length > 0 
      ? Math.round(totalDuration / callsWithDuration.length) 
      : 0;
  }

  prepareChartData(): void {
    // Calls by status
    const statusCount: {[key: string]: number} = {};
    this.calls.forEach(call => {
      statusCount[call.status] = (statusCount[call.status] || 0) + 1;
    });
    
    this.callsByStatus = Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize
      value: count
    }));
    
    // Calls by method
    const methodCount: {[key: string]: number} = {};
    this.calls.forEach(call => {
      const method = call.method || 'unknown';
      methodCount[method] = (methodCount[method] || 0) + 1;
    });
    
    this.callsByMethod = Object.entries(methodCount).map(([method, count]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1), // Capitalize
      value: count
    }));
    
    // Calls by day
    const dayCount: {[key: string]: number} = {};
    const startDate = new Date(this.dateRange.start);
    const endDate = new Date(this.dateRange.end);
    
    // Initialize all dates in range with 0 count
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dayCount[dateStr] = 0;
    }
    
    // Count calls by day
    this.calls.forEach(call => {
      const dateStr = new Date(call.scheduled_at).toISOString().split('T')[0];
      dayCount[dateStr] = (dayCount[dateStr] || 0) + 1;
    });
    
    this.callsByDay = Object.entries(dayCount).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  updateDateRange(): void {
    this.loadReportData();
  }

  exportReport(): void {
    this.notificationService.info('Report export functionality will be implemented soon');
  }
}