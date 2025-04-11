// src/app/features/ecommerce/products/product-detail/product-detail.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ProductDetailComponent {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();

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

  closeModal(): void {
    this.close.emit();
  }
}
