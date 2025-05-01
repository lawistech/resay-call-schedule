// src/app/features/ecommerce/product-knowledge-base/knowledge-base-analytics.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeBaseAnalyticsService } from '../services/knowledge-base-analytics.service';
import { ProductKnowledgeBaseService } from '../services/product-knowledge-base.service';
import { ProductCatalogService } from '../services/product-catalog.service';
import { ProductCatalog } from '../models/product-catalog.model';
import { KnowledgeBaseFeedback } from '../models/product-knowledge-base.model';

@Component({
  selector: 'app-knowledge-base-analytics',
  templateUrl: './knowledge-base-analytics.component.html',
  styleUrls: ['./knowledge-base-analytics.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class KnowledgeBaseAnalyticsComponent implements OnInit {
  // Data
  products: ProductCatalog[] = [];
  selectedProductId = '';
  popularEntries: any[] = [];
  pendingFeedback: KnowledgeBaseFeedback[] = [];
  
  // Analytics data
  viewsCount = 0;
  searchCount = 0;
  downloadCount = 0;
  averageRating = 0;
  totalRatings = 0;
  
  // UI state
  isLoading = true;
  activeTab: 'overview' | 'feedback' | 'popular' = 'overview';
  
  // Feedback response
  feedbackResponse = '';
  selectedFeedbackId = '';
  selectedStatus: 'reviewed' | 'implemented' | 'rejected' = 'reviewed';
  isSubmitting = false;

  constructor(
    private analyticsService: KnowledgeBaseAnalyticsService,
    private knowledgeBaseService: ProductKnowledgeBaseService,
    private productService: ProductCatalogService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadPendingFeedback();
    this.loadPopularEntries();
  }

  /**
   * Load all products
   */
  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        
        if (this.products.length > 0 && !this.selectedProductId) {
          this.selectedProductId = this.products[0].id;
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  /**
   * Load pending feedback
   */
  loadPendingFeedback(): void {
    this.analyticsService.getPendingFeedback().subscribe({
      next: (feedback) => {
        this.pendingFeedback = feedback;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending feedback:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load popular entries
   */
  loadPopularEntries(): void {
    this.analyticsService.getPopularEntries().subscribe({
      next: (entries) => {
        this.popularEntries = entries;
      },
      error: (error) => {
        console.error('Error loading popular entries:', error);
      }
    });
  }

  /**
   * Set the active tab
   */
  setActiveTab(tab: 'overview' | 'feedback' | 'popular'): void {
    this.activeTab = tab;
  }

  /**
   * Prepare to respond to feedback
   */
  prepareResponse(feedback: KnowledgeBaseFeedback): void {
    this.selectedFeedbackId = feedback.id;
    this.feedbackResponse = '';
    this.selectedStatus = 'reviewed';
  }

  /**
   * Submit feedback response
   */
  submitResponse(): void {
    if (!this.selectedFeedbackId) {
      return;
    }
    
    this.isSubmitting = true;
    this.analyticsService.updateFeedbackStatus(
      this.selectedFeedbackId,
      this.selectedStatus,
      this.feedbackResponse
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.selectedFeedbackId = '';
        this.feedbackResponse = '';
        this.loadPendingFeedback();
      },
      error: (error) => {
        console.error('Error updating feedback:', error);
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Cancel feedback response
   */
  cancelResponse(): void {
    this.selectedFeedbackId = '';
    this.feedbackResponse = '';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'Unknown date';
    }
    
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Get product name by ID
   */
  getProductName(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
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
