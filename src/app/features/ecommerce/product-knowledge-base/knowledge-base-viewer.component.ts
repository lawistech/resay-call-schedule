// src/app/features/ecommerce/product-knowledge-base/knowledge-base-viewer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductKnowledgeBaseService } from '../services/product-knowledge-base.service';
import { ProductCatalogService } from '../services/product-catalog.service';
import { KnowledgeBaseAnalyticsService } from '../services/knowledge-base-analytics.service';
import {
  ProductKnowledgeBase,
  CompetitiveAnalysis,
  ProductKnowledgeBaseComplete
} from '../models/product-knowledge-base.model';
import { KnowledgeBaseAttachmentsComponent } from './knowledge-base-attachments.component';
import { KnowledgeBaseFeedbackComponent } from './knowledge-base-feedback.component';
import { KnowledgeBaseHistoryComponent } from './knowledge-base-history.component';
import { ProductCatalog } from '../models/product-catalog.model';

@Component({
  selector: 'app-knowledge-base-viewer',
  templateUrl: './knowledge-base-viewer.component.html',
  styleUrls: ['./knowledge-base-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    KnowledgeBaseAttachmentsComponent,
    KnowledgeBaseFeedbackComponent,
    KnowledgeBaseHistoryComponent
  ]
})
export class KnowledgeBaseViewerComponent implements OnInit {
  // Data
  products: ProductCatalog[] = [];
  selectedProductId: string = '';
  knowledgeBase: ProductKnowledgeBaseComplete | null = null;

  // UI state
  isLoading = true;
  activeTab: 'specs' | 'usage' | 'faq' | 'competitive' = 'specs';
  searchTerm = '';

  constructor(
    private knowledgeBaseService: ProductKnowledgeBaseService,
    private productService: ProductCatalogService,
    private analyticsService: KnowledgeBaseAnalyticsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    // Check for product ID in route params
    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        this.selectedProductId = params['productId'];
        this.loadKnowledgeBase(this.selectedProductId);
      }
    });
  }

  /**
   * Load all products
   */
  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;

        // If no product is selected yet but we have products, select the first one
        if (!this.selectedProductId && this.products.length > 0) {
          this.selectedProductId = this.products[0].id;
          this.loadKnowledgeBase(this.selectedProductId);

          // Update URL with the selected product
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { productId: this.selectedProductId },
            queryParamsHandling: 'merge'
          });
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load knowledge base for a specific product
   */
  loadKnowledgeBase(productId: string): void {
    this.isLoading = true;
    this.knowledgeBaseService.getCompleteKnowledgeBase(productId).subscribe({
      next: (knowledgeBase) => {
        this.knowledgeBase = knowledgeBase;
        this.isLoading = false;

        // Track view for analytics
        if (knowledgeBase.technicalSpecs.length > 0) {
          this.trackView(knowledgeBase.technicalSpecs[0].id);
        } else if (knowledgeBase.usageScenarios.length > 0) {
          this.trackView(knowledgeBase.usageScenarios[0].id);
        } else if (knowledgeBase.faqs.length > 0) {
          this.trackView(knowledgeBase.faqs[0].id);
        } else if (knowledgeBase.competitiveAnalysis.entries.length > 0) {
          this.trackView(knowledgeBase.competitiveAnalysis.entries[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading knowledge base:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Track view for analytics
   */
  trackView(knowledgeBaseId: string): void {
    this.analyticsService.trackAction(knowledgeBaseId, 'view').subscribe({
      error: (error) => {
        console.error('Error tracking view:', error);
      }
    });
  }

  /**
   * Handle product selection change
   */
  onProductChange(): void {
    if (this.selectedProductId) {
      this.loadKnowledgeBase(this.selectedProductId);

      // Update URL with the selected product
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { productId: this.selectedProductId },
        queryParamsHandling: 'merge'
      });
    }
  }

  /**
   * Switch between tabs
   */
  setActiveTab(tab: 'specs' | 'usage' | 'faq' | 'competitive'): void {
    this.activeTab = tab;
  }

  /**
   * Filter entries by search term
   */
  filterEntries(entries: ProductKnowledgeBase[]): ProductKnowledgeBase[] {
    if (!this.searchTerm) {
      return entries;
    }

    const term = this.searchTerm.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(term) ||
      entry.content.toLowerCase().includes(term)
    );
  }

  /**
   * Format content with line breaks for display
   */
  formatContent(content: string): string {
    return content.replace(/\n/g, '<br>');
  }

  /**
   * Check if the current tab has any entries
   */
  hasEntries(tab: 'specs' | 'usage' | 'faq' | 'competitive'): boolean {
    if (!this.knowledgeBase) {
      return false;
    }

    switch (tab) {
      case 'specs':
        return this.knowledgeBase.technicalSpecs.length > 0;
      case 'usage':
        return this.knowledgeBase.usageScenarios.length > 0;
      case 'faq':
        return this.knowledgeBase.faqs.length > 0;
      case 'competitive':
        return this.knowledgeBase.competitiveAnalysis.entries.length > 0;
    }
  }
}
