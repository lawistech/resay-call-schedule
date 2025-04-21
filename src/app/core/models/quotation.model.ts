// src/app/core/models/quotation.model.ts
import { ProductCatalog } from '../../features/ecommerce/models/product-catalog.model';

export interface Quotation {
  id: string;
  companyId: string;
  contactId?: string;
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  stage?: 'Prospecting' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed-Won';
  probability?: number;
  total: number;
  validUntil?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: QuotationItem[];
  company?: {
    id: string;
    name: string;
  };
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  product?: ProductCatalog;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
