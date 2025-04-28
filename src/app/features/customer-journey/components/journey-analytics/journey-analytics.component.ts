// src/app/features/customer-journey/components/journey-analytics/journey-analytics.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CustomerJourneyService } from '../../../../core/services/customer-journey.service';
import { JourneyAnalytics } from '../../../../core/models/customer-journey.model';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-journey-analytics',
  templateUrl: './journey-analytics.component.html',
  styleUrls: ['./journey-analytics.component.scss']
})
export class JourneyAnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('conversionChart') conversionChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('channelChart') channelChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  analytics: JourneyAnalytics | null = null;
  isLoading = true;
  
  conversionChart: Chart | null = null;
  channelChart: Chart | null = null;

  constructor(private customerJourneyService: CustomerJourneyService) { }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    // Charts will be created after data is loaded
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.customerJourneyService.getJourneyAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.isLoading = false;
        
        // Create charts after data is loaded
        setTimeout(() => {
          this.createConversionChart();
          this.createChannelChart();
        });
      },
      error: (error) => {
        console.error('Error loading journey analytics:', error);
        this.isLoading = false;
      }
    });
  }

  private createConversionChart(): void {
    if (!this.conversionChartCanvas || !this.analytics) {
      return;
    }

    const ctx = this.conversionChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare data for the chart
    const labels = this.analytics.conversionRates.map(item => item.stageName);
    const data = this.analytics.conversionRates.map(item => item.rate);
    
    // Create the chart
    this.conversionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Conversion Rate (%)',
            data: data,
            backgroundColor: '#60A5FA', // blue-400
            borderColor: '#2563EB', // blue-600
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Conversion Rate (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Journey Stages'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Conversion Rate: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
  }

  private createChannelChart(): void {
    if (!this.channelChartCanvas || !this.analytics) {
      return;
    }

    const ctx = this.channelChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare data for the chart
    const labels = this.analytics.channelEffectiveness.map(item => item.channel);
    const data = this.analytics.channelEffectiveness.map(item => item.effectiveness);
    
    // Create the chart
    this.channelChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Channel Effectiveness',
            data: data,
            backgroundColor: 'rgba(167, 139, 250, 0.2)', // purple-400 with opacity
            borderColor: '#8B5CF6', // violet-500
            borderWidth: 2,
            pointBackgroundColor: '#8B5CF6', // violet-500
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#8B5CF6' // violet-500
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Effectiveness: ${context.raw}/100`;
              }
            }
          }
        }
      }
    });
  }
}
