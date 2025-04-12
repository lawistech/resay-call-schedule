// src/app/core/models/order.model.ts
import { OpportunityProduct } from './company.model';

export interface Order {
  id: string;
  opportunityId?: string;
  companyId: string;
  contactId?: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  notes?: string;
  successNotes?: string;
  orderDate: string | Date;
  completionDate?: string | Date;
  items?: OrderItem[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastContactDate?: string | Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
