// src/app/features/customer-journey/components/journey-visualization/journey-visualization.component.ts
import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CustomerJourney, CustomerTouchpoint, JourneyStage } from '../../../../core/models/customer-journey.model';
import { Chart, ChartConfiguration, ChartEvent, ChartType } from 'chart.js';
import { format } from 'date-fns';

@Component({
  selector: 'app-journey-visualization',
  templateUrl: './journey-visualization.component.html',
  styleUrls: ['./journey-visualization.component.scss']
})
export class JourneyVisualizationComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() journey: CustomerJourney | null = null;
  @Input() selectedStage: JourneyStage | null = null;
  @ViewChild('journeyCanvas') journeyCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | null = null;
  stageColors: { [key: string]: string } = {
    'lead': '#60A5FA', // blue-400
    'qualified': '#34D399', // green-400
    'opportunity': '#A78BFA', // purple-400
    'proposal': '#F59E0B', // amber-500
    'negotiation': '#EC4899', // pink-500
    'closed': '#10B981', // emerald-500
    'customer': '#14B8A6', // teal-500
    'loyal': '#8B5CF6'  // violet-500
  };
  
  touchpointColors: { [key: string]: string } = {
    'email': '#60A5FA', // blue-400
    'call': '#34D399', // green-400
    'meeting': '#A78BFA', // purple-400
    'quote': '#F59E0B', // amber-500
    'order': '#EC4899', // pink-500
    'website': '#10B981', // emerald-500
    'other': '#6B7280'  // gray-500
  };
  
  touchpointIcons: { [key: string]: string } = {
    'email': '✉️',
    'call': '📞',
    'meeting': '👥',
    'quote': '💰',
    'order': '🛒',
    'website': '🌐',
    'other': '📌'
  };

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['journey'] && this.journeyCanvas) {
      if (this.chart) {
        this.chart.destroy();
      }
      this.createChart();
    }
    
    if (changes['selectedStage'] && this.chart) {
      this.highlightSelectedStage();
    }
  }

  private createChart(): void {
    if (!this.journeyCanvas || !this.journey) {
      return;
    }

    const ctx = this.journeyCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare data for the chart
    const stages = this.journey.stages;
    const labels = stages.map(stage => stage.name);
    
    // Count touchpoints per stage
    const touchpointCounts = stages.map(stage => {
      return stage.touchpoints?.length || 0;
    });
    
    // Calculate conversion rates between stages
    const conversionRates = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      const currentCount = currentStage.touchpoints?.length || 0;
      const nextCount = nextStage.touchpoints?.length || 0;
      
      const rate = currentCount > 0 ? Math.round((nextCount / currentCount) * 100) : 0;
      conversionRates.push(rate);
    }
    conversionRates.push(0); // Add a placeholder for the last stage
    
    // Prepare colors based on the current stage
    const currentStageIndex = stages.findIndex(stage => stage.id === this.journey?.currentStage);
    const backgroundColors = stages.map((stage, index) => {
      const baseColor = this.stageColors[stage.id] || '#6B7280';
      if (index <= currentStageIndex) {
        return baseColor;
      } else {
        return this.hexToRgba(baseColor, 0.3);
      }
    });
    
    // Create the chart
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Touchpoints',
            data: touchpointCounts,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => this.hexToRgba(color, 1)),
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
            title: {
              display: true,
              text: 'Number of Touchpoints'
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
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const index = context.dataIndex;
                const rate = conversionRates[index];
                if (index < stages.length - 1) {
                  return `Conversion to next stage: ${rate}%`;
                }
                return '';
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
    
    // Add a line chart on top to show the journey path
    this.addJourneyPathLine();
  }

  private addJourneyPathLine(): void {
    if (!this.chart || !this.journey) return;
    
    const stages = this.journey.stages;
    
    // Get all touchpoints and sort by timestamp
    let allTouchpoints: CustomerTouchpoint[] = [];
    stages.forEach(stage => {
      if (stage.touchpoints) {
        allTouchpoints = [...allTouchpoints, ...stage.touchpoints];
      }
    });
    
    allTouchpoints.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // Create a dataset for each touchpoint type
    const touchpointTypes = [...new Set(allTouchpoints.map(tp => tp.type))];
    const datasets = touchpointTypes.map(type => {
      const typeTouchpoints = allTouchpoints.filter(tp => tp.type === type);
      
      return {
        type: 'scatter' as ChartType,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        data: typeTouchpoints.map(tp => {
          const stageIndex = stages.findIndex(stage => 
            stage.touchpoints?.some(stp => stp.id === tp.id)
          );
          
          return {
            x: stageIndex,
            y: 0, // We'll position these at the bottom
            touchpoint: tp
          };
        }),
        backgroundColor: this.touchpointColors[type] || '#6B7280',
        borderColor: this.touchpointColors[type] || '#6B7280',
        pointRadius: 6,
        pointHoverRadius: 8
      };
    });
    
    // Add the datasets to the chart
    datasets.forEach(dataset => {
      this.chart?.data.datasets.push(dataset as any);
    });
    
    this.chart.update();
  }

  private highlightSelectedStage(): void {
    if (!this.chart || !this.selectedStage) return;
    
    const stageIndex = this.journey?.stages.findIndex(stage => stage.id === this.selectedStage?.id) || -1;
    if (stageIndex === -1) return;
    
    // Update background colors to highlight the selected stage
    const backgroundColors = this.journey?.stages.map((stage, index) => {
      const baseColor = this.stageColors[stage.id] || '#6B7280';
      if (index === stageIndex) {
        return baseColor;
      } else {
        return this.hexToRgba(baseColor, 0.3);
      }
    });
    
    if (backgroundColors && this.chart.data.datasets[0]) {
      this.chart.data.datasets[0].backgroundColor = backgroundColors;
      this.chart.data.datasets[0].borderColor = backgroundColors.map(color => this.hexToRgba(color, 1));
      this.chart.update();
    }
  }

  // Helper function to convert hex color to rgba
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Format date for display
  formatDate(date: string): string {
    return format(new Date(date), 'MMM d, yyyy');
  }
}
