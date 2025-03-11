// src/app/features/reports/call-report/call-report.component.ts
import { Component, OnInit, Input, ViewChild, ElementRef, SimpleChanges, OnChanges } from '@angular/core';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-call-report',
  template: `
    <div [style.height.px]="height">
      <canvas #chart></canvas>
    </div>
  `,
  styles: []
})
export class CallReportComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() type: 'bar' | 'line' | 'pie' = 'bar';
  @Input() height: number = 250;
  @Input() colors: string[] = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];
  
  @ViewChild('chart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['type']) && this.chart) {
      this.chart.destroy();
      this.createChart();
    }
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.data || this.data.length === 0) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartConfig: any = {
      type: this.type,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: this.type === 'pie' ? 'right' : 'top',
          }
        }
      }
    };

    // Configure data based on chart type
    if (this.type === 'pie') {
      chartConfig.data = {
        labels: this.data.map(item => item.name),
        datasets: [{
          data: this.data.map(item => item.value),
          backgroundColor: this.colors.slice(0, this.data.length),
          hoverOffset: 4
        }]
      };
    } else if (this.type === 'bar') {
      chartConfig.data = {
        labels: this.data.map(item => item.name),
        datasets: [{
          label: 'Count',
          data: this.data.map(item => item.value),
          backgroundColor: this.colors[0],
          borderColor: this.colors[0],
          borderWidth: 1
        }]
      };
      
      // Additional options for bar chart
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      };
    } else if (this.type === 'line') {
      // Special case for time series (daily calls)
      if (this.data[0] && this.data[0].date) {
        chartConfig.data = {
          labels: this.data.map(item => new Date(item.date).toLocaleDateString()),
          datasets: [{
            label: 'Number of Calls',
            data: this.data.map(item => item.count),
            borderColor: this.colors[0],
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        };
      } else {
        chartConfig.data = {
          labels: this.data.map(item => item.name),
          datasets: [{
            label: 'Value',
            data: this.data.map(item => item.value),
            borderColor: this.colors[0],
            borderWidth: 2,
            tension: 0.4
          }]
        };
      }
      
      // Additional options for line chart
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      };
    }

    this.chart = new Chart(ctx, chartConfig);
  }
}