// src/app/features/email/email-templates/email-templates.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmailService } from '../../../core/services/email.service';
import { EmailTemplate } from '../../../core/models/email-template.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-email-templates',
  templateUrl: './email-templates.component.html',
  styleUrls: ['./email-templates.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class EmailTemplatesComponent implements OnInit {
  templates: EmailTemplate[] = [];
  filteredTemplates: EmailTemplate[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategory = 'all';
  categories: string[] = ['all'];

  constructor(
    private emailService: EmailService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.emailService.getEmailTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.filteredTemplates = templates;
        this.extractCategories();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.notificationService.error('Failed to load email templates');
        this.isLoading = false;
      }
    });
  }

  extractCategories(): void {
    // Extract unique categories from templates
    const uniqueCategories = new Set<string>();
    uniqueCategories.add('all');

    this.templates.forEach(template => {
      if (template.category) {
        uniqueCategories.add(template.category);
      }
    });

    this.categories = Array.from(uniqueCategories);
  }

  filterTemplates(): void {
    this.filteredTemplates = this.templates.filter(template => {
      // Filter by search term
      const matchesSearch =
        template.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        template.subject.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filter by category
      const matchesCategory =
        this.selectedCategory === 'all' ||
        template.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterTemplates();
  }

  onCategoryChange(event: Event): void {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.filterTemplates();
  }

  deleteTemplate(id: string): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.emailService.deleteEmailTemplate(id).subscribe({
        next: () => {
          this.templates = this.templates.filter(t => t.id !== id);
          this.filterTemplates();
          this.notificationService.success('Template deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting template:', error);
          this.notificationService.error('Failed to delete template');
        }
      });
    }
  }
}
