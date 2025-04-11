// src/app/features/ecommerce/services/product-attachment.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductCatalog } from '../models/product-catalog.model';

export interface ProductAttachment {
  id: string;
  productId: string;
  product?: ProductCatalog;
  quotationId?: string;
  emailId?: string;
  quantity: number;
  price: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductAttachmentService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  // Attach product to quotation
  attachProductToQuotation(productId: string, quotationId: string, quantity: number, price: number): Observable<ProductAttachment> {
    const attachment = {
      productId,
      quotationId,
      quantity,
      price,
      total: quantity * price
    };
    
    return from(this.supabaseService.supabaseClient
      .from('product_attachments')
      .insert(attachment)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Product attached to quotation successfully');
        return response.data[0];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to attach product to quotation: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Attach product to email
  attachProductToEmail(productId: string, emailId: string, quantity: number, price: number): Observable<ProductAttachment> {
    const attachment = {
      productId,
      emailId,
      quantity,
      price,
      total: quantity * price
    };
    
    return from(this.supabaseService.supabaseClient
      .from('product_attachments')
      .insert(attachment)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Product attached to email successfully');
        return response.data[0];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to attach product to email: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Get products attached to a quotation
  getProductsForQuotation(quotationId: string): Observable<ProductAttachment[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_attachments')
      .select(`
        *,
        product:product_catalog(*)
      `)
      .eq('quotationId', quotationId)
      .order('created_at', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch attached products: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Get products attached to an email
  getProductsForEmail(emailId: string): Observable<ProductAttachment[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_attachments')
      .select(`
        *,
        product:product_catalog(*)
      `)
      .eq('emailId', emailId)
      .order('created_at', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch attached products: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Update an attachment
  updateAttachment(id: string, quantity: number, price: number): Observable<ProductAttachment> {
    const updates = {
      quantity,
      price,
      total: quantity * price
    };
    
    return from(this.supabaseService.supabaseClient
      .from('product_attachments')
      .update(updates)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Product attachment updated successfully');
        return response.data[0];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update product attachment: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Remove an attachment
  removeAttachment(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('product_attachments')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Product attachment removed successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to remove product attachment: ${error.message}`);
        return throwError(() => error);
      })
    );
  }
}
