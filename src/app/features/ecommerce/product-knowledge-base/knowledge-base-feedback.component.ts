// src/app/features/ecommerce/product-knowledge-base/knowledge-base-feedback.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductKnowledgeBase, KnowledgeBaseFeedback, KnowledgeBaseRating } from '../models/product-knowledge-base.model';
import { KnowledgeBaseAnalyticsService } from '../services/knowledge-base-analytics.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-knowledge-base-feedback',
  templateUrl: './knowledge-base-feedback.component.html',
  styles: [],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class KnowledgeBaseFeedbackComponent implements OnInit {
  @Input() knowledgeBaseEntry!: ProductKnowledgeBase;

  // Feedback form
  feedbackText = '';
  selectedRating = 0;
  isHelpful: boolean | null = null;

  // Ratings data
  ratings: KnowledgeBaseRating | null = null;
  isLoading = true;

  // UI state
  showFeedbackForm = false;
  isSubmitting = false;
  feedbackSubmitted = false;

  constructor(
    private analyticsService: KnowledgeBaseAnalyticsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadRatings();
  }

  /**
   * Load ratings for the knowledge base entry
   */
  loadRatings(): void {
    this.isLoading = true;
    this.analyticsService.getRatings(this.knowledgeBaseEntry.id).subscribe({
      next: (ratings) => {
        this.ratings = ratings;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ratings:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Toggle the feedback form
   */
  toggleFeedbackForm(): void {
    this.showFeedbackForm = !this.showFeedbackForm;

    // Reset form when opening
    if (this.showFeedbackForm) {
      this.feedbackText = '';
      this.selectedRating = 0;
      this.isHelpful = null;
    }
  }

  /**
   * Set the rating
   */
  setRating(rating: number): void {
    this.selectedRating = rating;
  }

  /**
   * Set whether the content was helpful
   */
  setHelpful(helpful: boolean): void {
    this.isHelpful = helpful;
  }

  /**
   * Submit feedback
   */
  submitFeedback(): void {
    // Validate form
    if (this.selectedRating === 0 && !this.isHelpful && !this.feedbackText) {
      this.notificationService.warning('Please provide a rating, indicate if the content was helpful, or leave a comment.');
      return;
    }

    this.isSubmitting = true;
    this.analyticsService.submitFeedback(
      this.knowledgeBaseEntry.id,
      {
        rating: this.selectedRating > 0 ? this.selectedRating : undefined,
        feedbackText: this.feedbackText || undefined,
        isHelpful: this.isHelpful !== null ? this.isHelpful : undefined
      }
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.feedbackSubmitted = true;
        this.showFeedbackForm = false;
        this.loadRatings(); // Refresh ratings
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Get star rating display
   */
  getStarRating(rating: number): string[] {
    const stars = [];

    // Full stars
    for (let i = 1; i <= Math.floor(rating); i++) {
      stars.push('full');
    }

    // Half star
    if (rating % 1 >= 0.5) {
      stars.push('half');
    }

    // Empty stars
    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }
}
