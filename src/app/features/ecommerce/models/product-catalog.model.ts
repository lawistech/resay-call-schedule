// src/app/features/ecommerce/models/product-catalog.model.ts
export interface ProductCatalog {
  id: string;
  supplierId: string;
  supplierName?: string; // For display purposes
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number; // Purchase cost from supplier
  stockQuantity?: number;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
