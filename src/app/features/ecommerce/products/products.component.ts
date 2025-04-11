// src/app/features/ecommerce/products/products.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EcommerceService } from '../ecommerce.service';
import { Product } from '../models/product.model';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, ProductDetailComponent],
  providers: [EcommerceService]
})
export class ProductsComponent implements OnInit {
  // Make Math available to the template
  Math = Math;
  isLoading = true;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedSite: string = '';
  searchTerm: string = '';
  categoryFilter: string = '';
  stockFilter: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Selected product for details
  selectedProduct: Product | null = null;
  showProductDetails = false;

  // Available categories
  categories: { name: string, count: number }[] = [];
  isLoadingCategories = false;

  websites = [
    { id: 'resay', name: 'Resay' },
    { id: 'androidEpos', name: 'Android EPOS' },
    { id: 'barcode', name: 'BarcodeForBusiness' }
  ];

  constructor(
    private route: ActivatedRoute,
    private ecommerceService: EcommerceService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['site']) {
        this.selectedSite = params['site'];
        this.loadCategories();
      }
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.products = [];
    this.filteredProducts = [];

    // Convert stock filter to WooCommerce stock_status format
    let stockStatus: string | undefined;
    if (this.stockFilter === 'inStock') {
      stockStatus = 'instock';
    } else if (this.stockFilter === 'outOfStock') {
      stockStatus = 'outofstock';
    }

    // Get products from the selected site or all sites if none selected
    // Pass pagination, category, and stock status parameters to the API
    this.ecommerceService.getProducts(
      this.selectedSite,
      this.currentPage,
      this.itemsPerPage,
      this.categoryFilter,
      stockStatus
    )
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        catchError(error => {
          console.error('Error loading products:', error);
          // Show a more detailed error message to the user
          const errorMessage = error.message || 'Unknown error';
          alert(`Failed to load products: ${errorMessage}\n\nUsing mock data as fallback.`);
          // In case of error, we'll use mock data as a fallback
          return of(this.getMockProducts());
        })
      )
      .subscribe(products => {
        if (products.length === 0 && this.currentPage === 1) {
          // If no products are returned and we're on the first page, show mock data
          console.log('No products found, using mock data');
          this.products = this.getMockProducts();
        } else {
          this.products = products;
        }
        this.applyFilters();
      });
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter locally (the API doesn't support text search well)
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search)
      );
    }

    // Handle low stock filter locally (since WooCommerce API doesn't have a direct parameter for this)
    if (this.stockFilter === 'lowStock') {
      filtered = filtered.filter(product =>
        product.stockStatus === 'instock' && product.stockQuantity && product.stockQuantity < 5
      );
    }

    this.totalItems = filtered.length;
    this.filteredProducts = filtered;
  }

  onSearch(): void {
    this.currentPage = 1;
    // For search, we'll apply filters locally since the API doesn't support text search
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    // Reset to page 1 and reload products
    this.loadProducts();
  }

  onStockFilterChange(): void {
    this.currentPage = 1;
    // Reset to page 1 and reload products
    this.loadProducts();
  }

  onSiteChange(): void {
    this.currentPage = 1;
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    if (!this.selectedSite) {
      this.categories = [];
      return;
    }

    this.isLoadingCategories = true;
    this.ecommerceService.getCategories(this.selectedSite)
      .pipe(
        finalize(() => {
          this.isLoadingCategories = false;
        }),
        catchError(error => {
          console.error('Error loading categories:', error);
          return of([]);
        })
      )
      .subscribe(categories => {
        this.categories = categories.map(cat => ({
          name: cat.name,
          count: cat.count
        }));
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Reload products from the API with the new page number
    this.loadProducts();
  }

  viewProductDetails(product: Product): void {
    this.selectedProduct = product;
    this.showProductDetails = true;
  }

  closeProductDetails(): void {
    this.showProductDetails = false;
    this.selectedProduct = null;
  }

  getStockStatusClass(status: string): string {
    switch (status) {
      case 'instock':
        return 'bg-green-100 text-green-800';
      case 'outofstock':
        return 'bg-red-100 text-red-800';
      case 'onbackorder':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStockStatusText(status: string): string {
    switch (status) {
      case 'instock':
        return 'In Stock';
      case 'outofstock':
        return 'Out of Stock';
      case 'onbackorder':
        return 'On Backorder';
      default:
        return status;
    }
  }

  getWebsiteName(siteId: string): string {
    const website = this.websites.find(w => w.id === siteId);
    return website ? website.name : siteId;
  }

  // Mock data for demonstration
  private getMockProducts(): Product[] {
    const mockProducts: Product[] = [];

    // Resay products
    mockProducts.push(
      {
        id: '1',
        site: 'resay',
        name: 'Resay Business Phone System',
        sku: 'RSY-001',
        price: 299.99,
        regularPrice: 349.99,
        salePrice: 299.99,
        onSale: true,
        stockStatus: 'instock',
        stockQuantity: 15,
        categories: ['Phone Systems', 'Business'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Complete business phone system for small to medium businesses.',
        dateCreated: new Date('2023-01-15'),
        dateModified: new Date('2023-06-20')
      },
      {
        id: '2',
        site: 'resay',
        name: 'Resay Mobile App License',
        sku: 'RSY-002',
        price: 49.99,
        regularPrice: 49.99,
        salePrice: null,
        onSale: false,
        stockStatus: 'instock',
        stockQuantity: 100,
        categories: ['Software', 'Mobile'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Mobile application license for Resay phone system.',
        dateCreated: new Date('2023-02-10'),
        dateModified: new Date('2023-02-10')
      },
      {
        id: '3',
        site: 'resay',
        name: 'Resay Desktop Phone',
        sku: 'RSY-003',
        price: 129.99,
        regularPrice: 149.99,
        salePrice: 129.99,
        onSale: true,
        stockStatus: 'instock',
        stockQuantity: 3,
        categories: ['Hardware', 'Phones'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Desktop phone compatible with Resay phone system.',
        dateCreated: new Date('2023-03-05'),
        dateModified: new Date('2023-07-12')
      }
    );

    // Android EPOS products
    mockProducts.push(
      {
        id: '4',
        site: 'androidEpos',
        name: 'Android EPOS Terminal',
        sku: 'AEPOS-001',
        price: 499.99,
        regularPrice: 499.99,
        salePrice: null,
        onSale: false,
        stockStatus: 'instock',
        stockQuantity: 8,
        categories: ['Hardware', 'POS'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Complete Android-based EPOS terminal for retail and restaurants.',
        dateCreated: new Date('2023-01-20'),
        dateModified: new Date('2023-01-20')
      },
      {
        id: '5',
        site: 'androidEpos',
        name: 'Receipt Printer',
        sku: 'AEPOS-002',
        price: 89.99,
        regularPrice: 99.99,
        salePrice: 89.99,
        onSale: true,
        stockStatus: 'instock',
        stockQuantity: 12,
        categories: ['Hardware', 'Accessories'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Thermal receipt printer compatible with Android EPOS systems.',
        dateCreated: new Date('2023-02-15'),
        dateModified: new Date('2023-05-10')
      },
      {
        id: '6',
        site: 'androidEpos',
        name: 'Cash Drawer',
        sku: 'AEPOS-003',
        price: 79.99,
        regularPrice: 79.99,
        salePrice: null,
        onSale: false,
        stockStatus: 'outofstock',
        stockQuantity: 0,
        categories: ['Hardware', 'Accessories'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Cash drawer for retail point of sale systems.',
        dateCreated: new Date('2023-03-10'),
        dateModified: new Date('2023-03-10')
      }
    );

    // BarcodeForBusiness products
    mockProducts.push(
      {
        id: '7',
        site: 'barcode',
        name: 'Barcode Scanner',
        sku: 'BFB-001',
        price: 149.99,
        regularPrice: 169.99,
        salePrice: 149.99,
        onSale: true,
        stockStatus: 'instock',
        stockQuantity: 20,
        categories: ['Hardware', 'Scanners'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Professional barcode scanner for business use.',
        dateCreated: new Date('2023-01-25'),
        dateModified: new Date('2023-04-15')
      },
      {
        id: '8',
        site: 'barcode',
        name: 'Barcode Label Printer',
        sku: 'BFB-002',
        price: 199.99,
        regularPrice: 199.99,
        salePrice: null,
        onSale: false,
        stockStatus: 'instock',
        stockQuantity: 5,
        categories: ['Hardware', 'Printers'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'High-quality barcode label printer for business applications.',
        dateCreated: new Date('2023-02-20'),
        dateModified: new Date('2023-02-20')
      },
      {
        id: '9',
        site: 'barcode',
        name: 'Barcode Software License',
        sku: 'BFB-003',
        price: 79.99,
        regularPrice: 99.99,
        salePrice: 79.99,
        onSale: true,
        stockStatus: 'instock',
        stockQuantity: 100,
        categories: ['Software', 'Business'],
        images: ['https://via.placeholder.com/300x300'],
        description: 'Barcode generation and management software license.',
        dateCreated: new Date('2023-03-15'),
        dateModified: new Date('2023-06-05')
      }
    );

    return mockProducts;
  }
}
