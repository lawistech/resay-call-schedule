// src/app/features/ecommerce/product-catalog/product-catalog.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProductCatalogService } from '../services/product-catalog.service';
import { SupplierService } from '../services/supplier.service';
import { ProductScraperService, ScrapedProduct } from '../services/product-scraper.service';
import { ProductCatalog } from '../models/product-catalog.model';
import { Supplier } from '../models/supplier.model';
import { NotificationService } from '../../../core/services/notification.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule]
})
export class ProductCatalogComponent implements OnInit {
  products: ProductCatalog[] = [];
  suppliers: Supplier[] = [];
  isLoading = true;
  isLoadingSuppliers = true;
  showForm = false;
  isEditing = false;
  currentProduct: ProductCatalog | null = null;
  productForm: FormGroup;
  searchTerm = '';
  supplierFilter = '';
  categoryFilter = '';
  filteredProducts: ProductCatalog[] = [];
  categories: string[] = [];

  // Product URL scraping
  productUrl = '';
  isScrapingProduct = false;

  constructor(
    private productService: ProductCatalogService,
    private supplierService: SupplierService,
    private productScraperService: ProductScraperService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.productForm = this.fb.group({
      supplierId: ['', [Validators.required]],
      name: ['', [Validators.required]],
      sku: ['', [Validators.required]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.min(0)]],
      stockQuantity: [0, [Validators.min(0)]],
      category: [''],
      tags: [''],
      imageUrl: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadSuppliers();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.extractCategories();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  loadSuppliers(): void {
    this.isLoadingSuppliers = true;
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.isLoadingSuppliers = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.isLoadingSuppliers = false;
      }
    });
  }

  extractCategories(): void {
    const categorySet = new Set<string>();
    this.products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  filterProducts(): void {
    let filtered = this.products;

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        (product.description && product.description.toLowerCase().includes(search))
      );
    }

    // Filter by supplier
    if (this.supplierFilter) {
      filtered = filtered.filter(product => product.supplierId === this.supplierFilter);
    }

    // Filter by category
    if (this.categoryFilter) {
      filtered = filtered.filter(product => product.category === this.categoryFilter);
    }

    this.filteredProducts = filtered;
  }

  openForm(product?: ProductCatalog): void {
    this.showForm = true;
    this.isEditing = !!product;
    this.currentProduct = product || null;

    if (product) {
      this.productForm.patchValue({
        supplierId: product.supplierId,
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        price: product.price,
        cost: product.cost || 0,
        stockQuantity: product.stockQuantity || 0,
        category: product.category || '',
        tags: product.tags ? product.tags.join(', ') : '',
        imageUrl: product.imageUrl || '',
        isActive: product.isActive
      });
    } else {
      this.productForm.reset({
        price: 0,
        cost: 0,
        stockQuantity: 0,
        isActive: true
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.currentProduct = null;
    this.productForm.reset({
      price: 0,
      cost: 0,
      stockQuantity: 0,
      isActive: true
    });
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const productData = { ...this.productForm.value };

    // Convert tags from comma-separated string to array
    if (productData.tags) {
      productData.tags = productData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    } else {
      productData.tags = [];
    }

    if (this.isEditing && this.currentProduct) {
      this.productService.updateProduct(this.currentProduct.id, productData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error updating product:', error);
        }
      });
    } else {
      this.productService.createProduct(productData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error creating product:', error);
        }
      });
    }
  }

  deleteProduct(product: ProductCatalog): void {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  getSupplierName(supplierId: string): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  /**
   * Set an example URL for product scraping
   */
  setExampleUrl(url: string): void {
    this.productUrl = url;
  }

  /**
   * Scrape product information from a URL
   * This will populate the product form with the scraped data
   */
  scrapeProduct(): void {
    console.log('Scraping product from URL:', this.productUrl);

    if (!this.productUrl) {
      this.notificationService.warning('Please enter a product URL');
      return;
    }

    this.isScrapingProduct = true;
    this.notificationService.info('Importing product information...');

    this.productScraperService.scrapeProductFromUrl(this.productUrl)
      .pipe(finalize(() => {
        console.log('Scraping completed');
        this.isScrapingProduct = false;
      }))
      .subscribe({
        next: (scrapedProduct: ScrapedProduct) => {
          console.log('Product scraped successfully:', scrapedProduct);

          // Populate the form with the scraped data
          this.productForm.patchValue({
            name: scrapedProduct.name,
            sku: scrapedProduct.sku,
            description: scrapedProduct.description || '',
            price: scrapedProduct.price,
            category: scrapedProduct.category || '',
            tags: scrapedProduct.tags ? scrapedProduct.tags.join(', ') : '',
            imageUrl: scrapedProduct.imageUrl || ''
          });

          this.notificationService.success('Product information imported successfully');
        },
        error: (error: any) => {
          console.error('Error scraping product:', error);
          this.notificationService.error(`Failed to import product information: ${error?.message || 'Unknown error'}`);
        }
      });
  }
}
