// src/app/features/email/email-dashboard/email-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmailService } from '../../../core/services/email.service';
import { EmailTemplate } from '../../../core/models/email-template.model';
import { EmailCampaign } from '../../../core/models/email-campaign.model';

@Component({
  selector: 'app-email-dashboard',
  templateUrl: './email-dashboard.component.html',
  styleUrls: ['./email-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class EmailDashboardComponent implements OnInit {
  recentTemplates: EmailTemplate[] = [];
  recentCampaigns: EmailCampaign[] = [];
  isLoading = true;

  constructor(private emailService: EmailService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Load recent templates
    this.emailService.getEmailTemplates().subscribe({
      next: (templates) => {
        this.recentTemplates = templates.slice(0, 5); // Get the 5 most recent templates
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.isLoading = false;
      }
    });

    // Load recent campaigns
    this.emailService.getEmailCampaigns().subscribe({
      next: (campaigns) => {
        this.recentCampaigns = campaigns.slice(0, 5); // Get the 5 most recent campaigns
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
      }
    });
  }
}
