// src/app/features/email/email-templates/email-template-detail/email-template-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmailService } from '../../../../core/services/email.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmailTemplate } from '../../../../core/models/email-template.model';

@Component({
  selector: 'app-email-template-detail',
  templateUrl: './email-template-detail.component.html',
  styleUrls: ['./email-template-detail.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class EmailTemplateDetailComponent implements OnInit {
  template: EmailTemplate | null = null;
  isLoading = true;
  templateId: string | null = null;

  constructor(
    private emailService: EmailService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('id');
    
    if (this.templateId) {
      this.loadTemplate(this.templateId);
    } else {
      this.notificationService.error('Template ID not found');
      this.router.navigate(['/email/templates']);
    }
  }

  loadTemplate(id: string): void {
    this.isLoading = true;
    
    this.emailService.getEmailTemplateById(id).subscribe({
      next: (template) => {
        this.template = template;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading template:', error);
        this.notificationService.error('Failed to load template');
        this.isLoading = false;
        this.router.navigate(['/email/templates']);
      }
    });
  }

  deleteTemplate(): void {
    if (!this.templateId) return;
    
    if (confirm('Are you sure you want to delete this template?')) {
      this.emailService.deleteEmailTemplate(this.templateId).subscribe({
        next: () => {
          this.notificationService.success('Template deleted successfully');
          this.router.navigate(['/email/templates']);
        },
        error: (error) => {
          console.error('Error deleting template:', error);
          this.notificationService.error('Failed to delete template');
        }
      });
    }
  }
}
