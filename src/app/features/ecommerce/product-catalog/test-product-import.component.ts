// src/app/features/ecommerce/product-catalog/test-product-import.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProductScraperService, ScrapedProduct } from '../services/product-scraper.service';
import { NotificationService } from '../../../core/services/notification.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-test-product-import',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="p-4 bg-white rounded-lg shadow">
      <h2 class="text-lg font-medium mb-4">Test Product URL Import</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
        <div class="flex">
          <input 
            type="text" 
            [(ngModel)]="productUrl" 
            placeholder="Enter product URL" 
            class="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
          <button 
            (click)="scrapeProduct()" 
            [disabled]="isLoading" 
            class="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span *ngIf="!isLoading">Import</span>
            <span *ngIf="isLoading">Loading...</span>
          </button>
        </div>
        <div class="mt-2">
          <button 
            (click)="setExampleUrl('https://resay.co.uk/product/product-1/')" 
            class="text-blue-500 text-sm hover:underline mr-2"
          >
            Example: Product 1
          </button>
          <button 
            (click)="setExampleUrl('https://resay.co.uk/product/product-2/')" 
            class="text-blue-500 text-sm hover:underline"
          >
            Example: Product 2
          </button>
        </div>
      </div>
      
      <div *ngIf="result" class="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
        <h3 class="font-medium mb-2">Result:</h3>
        <pre class="text-sm overflow-auto max-h-96">{{ result | json }}</pre>
      </div>
      
      <div *ngIf="error" class="mt-4 border border-red-200 rounded-md p-4 bg-red-50 text-red-700">
        <h3 class="font-medium mb-2">Error:</h3>
        <p>{{ error }}</p>
      </div>
    </div>
  `
})
export class TestProductImportComponent {
  productUrl = '';
  isLoading = false;
  result: ScrapedProduct | null = null;
  error: string | null = null;

  constructor(
    private productScraperService: ProductScraperService,
    private notificationService: NotificationService
  ) {}

  setExampleUrl(url: string): void {
    this.productUrl = url;
  }

  scrapeProduct(): void {
    if (!this.productUrl) {
      this.notificationService.warning('Please enter a product URL');
      return;
    }

    this.isLoading = true;
    this.result = null;
    this.error = null;

    this.productScraperService.scrapeProductFromUrl(this.productUrl)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (product) => {
          this.result = product;
          this.notificationService.success('Product information imported successfully');
        },
        error: (err) => {
          console.error('Error scraping product:', err);
          this.error = err?.message || 'Unknown error occurred';
          this.notificationService.error(`Failed to import product: ${this.error}`);
        }
      });
  }
}
