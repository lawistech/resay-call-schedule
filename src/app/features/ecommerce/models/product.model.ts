// src/app/features/ecommerce/models/product.model.ts
export interface Product {
  id: string;
  site: string;
  name: string;
  sku: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  categories: string[];
  images: string[];
  description: string;
  dateCreated: Date;
  dateModified: Date;
}
