// src/app/features/quotations/services/quotation.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Quotation, QuotationItem } from '../../../core/models/quotation.model';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  getQuotations(): Observable<Quotation[]> {
    return from(this.supabaseService.supabaseClient
      .from('quotations')
      .select(`
        *,
        company:companies(id, name)
      `)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Format the data to match our Quotation model
        return response.data.map(q => this.formatQuotationFromDatabase(q));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch quotations: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getQuotationsByCompany(companyId: string): Observable<Quotation[]> {
    console.log('QuotationService: Fetching quotations for company:', companyId);
    return from(this.supabaseService.supabaseClient
      .from('quotations')
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        console.log('QuotationService: Received response for company quotations:', response.data);

        // Format the data to match our Quotation model
        const formattedQuotations = response.data.map(q => this.formatQuotationFromDatabase(q));
        console.log('QuotationService: Formatted quotations:', formattedQuotations);
        return formattedQuotations;
      }),
      catchError(error => {
        console.error('QuotationService: Error fetching company quotations:', error);
        this.notificationService.error(`Failed to fetch company quotations: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getQuotationById(id: string): Observable<Quotation> {
    return from(this.supabaseService.supabaseClient
      .from('quotations')
      .select(`
        *,
        company:companies(id, name),
        items:quotation_items(
          *,
          product:product_catalog(*)
        )
      `)
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Format the data to match our Quotation model
        return this.formatQuotationFromDatabase(response.data, true);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch quotation: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createQuotation(quotation: Partial<Quotation>): Observable<Quotation> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create quotations'));
    }

    // Convert camelCase to snake_case for database
    const dbQuotation: any = {
      company_id: quotation.companyId,
      contact_id: quotation.contactId || null,
      title: quotation.title,
      status: quotation.status || 'draft',
      total: quotation.total || 0,
      notes: quotation.notes || null
    };

    // Only add valid_until if it's a non-empty string
    if (quotation.validUntil && quotation.validUntil.trim() !== '') {
      dbQuotation.valid_until = quotation.validUntil;
    }

    return from(this.supabaseService.supabaseClient
      .from('quotations')
      .insert(dbQuotation)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Quotation created successfully');

        // Format the data to match our Quotation model
        return this.formatQuotationFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create quotation: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateQuotation(id: string, quotation: Partial<Quotation>): Observable<Quotation> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to update quotations'));
    }

    // Convert camelCase to snake_case for database
    const dbQuotation: any = {
      company_id: quotation.companyId,
      contact_id: quotation.contactId || null,
      title: quotation.title,
      status: quotation.status,
      total: quotation.total,
      notes: quotation.notes || null
    };

    // Only add valid_until if it's a non-empty string
    if (quotation.validUntil && quotation.validUntil.trim() !== '') {
      dbQuotation.valid_until = quotation.validUntil;
    }

    return from(this.supabaseService.supabaseClient
      .from('quotations')
      .update(dbQuotation)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Quotation updated successfully');

        // Format the data to match our Quotation model
        return this.formatQuotationFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update quotation: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Helper functions to format data
  private formatQuotationFromDatabase(data: any, includeItems: boolean = false): Quotation {
    const quotation: Quotation = {
      id: data.id,
      companyId: data.company_id,
      contactId: data.contact_id,
      title: data.title,
      status: data.status,
      total: data.total,
      validUntil: data.valid_until,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    // Add items if included in the response
    if (includeItems && data.items) {
      quotation.items = data.items.map((item: any) => ({
        id: item.id,
        quotationId: item.quotation_id,
        productId: item.product_id,
        product: item.product ? {
          id: item.product.id,
          supplierId: item.product.supplier_id,
          name: item.product.name,
          sku: item.product.sku,
          description: item.product.description,
          price: item.product.price,
          cost: item.product.cost,
          stockQuantity: item.product.stock_quantity,
          category: item.product.category,
          tags: item.product.tags,
          imageUrl: item.product.image_url,
          isActive: item.product.is_active,
          createdAt: item.product.created_at,
          updatedAt: item.product.updated_at
        } : undefined,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    }

    return quotation;
  }
}
