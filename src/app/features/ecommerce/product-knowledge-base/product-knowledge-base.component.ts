// src/app/features/ecommerce/product-knowledge-base/product-knowledge-base.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProductKnowledgeBaseService } from '../services/product-knowledge-base.service';
import { ProductCatalogService } from '../services/product-catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { 
  ProductKnowledgeBase, 
  CompetitiveAnalysis,
  KnowledgeBaseCategory
} from '../models/product-knowledge-base.model';
import { ProductCatalog } from '../models/product-catalog.model';

@Component({
  selector: 'app-product-knowledge-base',
  templateUrl: './product-knowledge-base.component.html',
  styleUrls: ['./product-knowledge-base.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class ProductKnowledgeBaseComponent implements OnInit {
  // Data
  knowledgeBaseEntries: ProductKnowledgeBase[] = [];
  products: ProductCatalog[] = [];
  filteredEntries: ProductKnowledgeBase[] = [];
  
  // UI state
  isLoading = true;
  showForm = false;
  isEditing = false;
  currentEntry: ProductKnowledgeBase | null = null;
  searchTerm = '';
  productFilter = '';
  categoryFilter: KnowledgeBaseCategory | '' = '';
  
  // Form
  knowledgeBaseForm: FormGroup;
  
  // Category options for dropdown
  categoryOptions = [
    { value: 'technical_specs', label: 'Technical Specifications' },
    { value: 'usage_scenarios', label: 'Usage Scenarios & Solutions' },
    { value: 'faq', label: 'FAQ' },
    { value: 'competitive_analysis', label: 'Competitive Analysis' }
  ];

  constructor(
    private knowledgeBaseService: ProductKnowledgeBaseService,
    private productService: ProductCatalogService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.knowledgeBaseForm = this.fb.group({
      productId: ['', [Validators.required]],
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      category: ['', [Validators.required]],
      tags: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadKnowledgeBase();
    this.loadProducts();
  }

  /**
   * Load all knowledge base entries
   */
  loadKnowledgeBase(): void {
    this.isLoading = true;
    this.knowledgeBaseService.getKnowledgeBaseEntries().subscribe({
      next: (entries) => {
        this.knowledgeBaseEntries = entries;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading knowledge base:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load all products for the dropdown
   */
  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  /**
   * Apply filters to the knowledge base entries
   */
  applyFilters(): void {
    let filtered = this.knowledgeBaseEntries;
    
    // Apply search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(term) || 
        entry.content.toLowerCase().includes(term) ||
        entry.product?.name.toLowerCase().includes(term)
      );
    }
    
    // Apply product filter
    if (this.productFilter) {
      filtered = filtered.filter(entry => entry.productId === this.productFilter);
    }
    
    // Apply category filter
    if (this.categoryFilter) {
      filtered = filtered.filter(entry => entry.category === this.categoryFilter);
    }
    
    this.filteredEntries = filtered;
  }

  /**
   * Open the form to create or edit an entry
   */
  openForm(entry?: ProductKnowledgeBase): void {
    this.showForm = true;
    this.isEditing = !!entry;
    this.currentEntry = entry || null;

    if (entry) {
      this.knowledgeBaseForm.patchValue({
        productId: entry.productId,
        title: entry.title,
        content: entry.content,
        category: entry.category,
        tags: entry.tags ? entry.tags.join(', ') : '',
        isActive: entry.isActive
      });
    } else {
      this.knowledgeBaseForm.reset({
        isActive: true
      });
    }
  }

  /**
   * Close the form
   */
  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.currentEntry = null;
    this.knowledgeBaseForm.reset({
      isActive: true
    });
  }

  /**
   * Submit the form to create or update an entry
   */
  submitForm(): void {
    if (this.knowledgeBaseForm.invalid) {
      this.notificationService.warning('Please fill in all required fields');
      return;
    }

    const formValue = this.knowledgeBaseForm.value;
    
    // Process tags from comma-separated string to array
    const tags = formValue.tags ? 
      formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : 
      [];
    
    const entryData: Partial<ProductKnowledgeBase> = {
      productId: formValue.productId,
      title: formValue.title,
      content: formValue.content,
      category: formValue.category,
      tags: tags,
      isActive: formValue.isActive
    };

    if (this.isEditing && this.currentEntry) {
      this.knowledgeBaseService.updateKnowledgeBaseEntry(this.currentEntry.id, entryData).subscribe({
        next: () => {
          this.loadKnowledgeBase();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error updating knowledge base entry:', error);
        }
      });
    } else {
      this.knowledgeBaseService.createKnowledgeBaseEntry(entryData).subscribe({
        next: () => {
          this.loadKnowledgeBase();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error creating knowledge base entry:', error);
        }
      });
    }
  }

  /**
   * Delete a knowledge base entry
   */
  deleteEntry(entry: ProductKnowledgeBase): void {
    if (confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      this.knowledgeBaseService.deleteKnowledgeBaseEntry(entry.id).subscribe({
        next: () => {
          this.loadKnowledgeBase();
        },
        error: (error) => {
          console.error('Error deleting knowledge base entry:', error);
        }
      });
    }
  }

  /**
   * Get the product name for display
   */
  getProductName(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  }

  /**
   * Get the category label for display
   */
  getCategoryLabel(category: KnowledgeBaseCategory): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  }

  /**
   * Format the content for display (first 100 characters)
   */
  formatContent(content: string): string {
    if (content.length <= 100) {
      return content;
    }
    return content.substring(0, 100) + '...';
  }
}
