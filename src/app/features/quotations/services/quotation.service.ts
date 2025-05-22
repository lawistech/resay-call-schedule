// src/app/features/quotations/services/quotation.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, tap } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Quotation, QuotationItem } from '../../../core/models/quotation.model';
import { OrderService } from '../../orders/order.service';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  getQuotations(): Observable<Quotation[]> {
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
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Format the data to match our Quotation model
        return response.data.map(q => this.formatQuotationFromDatabase(q, true));
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
        company:companies(id, name),
        items:quotation_items(
          *,
          product:product_catalog(*)
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        console.log('QuotationService: Received response for company quotations:', response.data);

        // Format the data to match our Quotation model
        const formattedQuotations = response.data.map(q => this.formatQuotationFromDatabase(q, true));
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
    console.log('Fetching quotation by ID:', id);
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

        console.log('Raw quotation data from database:', response.data);

        // Check if items are included in the response
        if (!response.data.items || !Array.isArray(response.data.items)) {
          console.warn('No items array found in quotation response');
        } else {
          console.log(`Found ${response.data.items.length} items in quotation`);
        }

        // Format the data to match our Quotation model
        const formattedQuotation = this.formatQuotationFromDatabase(response.data, true);
        console.log('Formatted quotation:', formattedQuotation);
        return formattedQuotation;
      }),
      catchError(error => {
        console.error('Error fetching quotation:', error);
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

    // Use the status directly since we're now using the same values as the database
    let dbStatus = quotation.status || 'draft'; // Default to draft

    // Convert camelCase to snake_case for database
    const dbQuotation: any = {
      company_id: quotation.companyId,
      contact_id: quotation.contactId || null,
      title: quotation.title,
      status: dbStatus,
      total: quotation.total || 0,
      vat_rate: quotation.vatRate || 20, // Default to 20% if not provided
      notes: quotation.notes || null
    };

    // Add the new fields
    if (quotation.description !== undefined) dbQuotation.description = quotation.description;
    if (quotation.stage !== undefined) dbQuotation.stage = quotation.stage;
    if (quotation.probability !== undefined) dbQuotation.probability = quotation.probability;

    // Only add valid_until if it's a non-empty string
    if (quotation.validUntil && quotation.validUntil.trim() !== '') {
      dbQuotation.valid_until = quotation.validUntil;
    }

    // Store items to add after quotation is created
    const items = quotation.items || [];

    return from(this.supabaseService.supabaseClient
      .from('quotations')
      .insert(dbQuotation)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        const createdQuotation = this.formatQuotationFromDatabase(response.data[0]);

        // If there are items, add them to the quotation
        if (items.length > 0) {
          this.addQuotationItems(createdQuotation.id, items);
        }

        this.notificationService.success('Quotation created successfully');
        return createdQuotation;
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

    // Use the status directly since we're now using the same values as the database
    let dbStatus = quotation.status || 'draft'; // Default to draft

    // Convert camelCase to snake_case for database
    const dbQuotation: any = {
      company_id: quotation.companyId,
      contact_id: quotation.contactId || null,
      title: quotation.title,
      status: dbStatus,
      total: quotation.total,
      vat_rate: quotation.vatRate || 20, // Default to 20% if not provided
      notes: quotation.notes || null
    };

    // Add the new fields
    if (quotation.description !== undefined) dbQuotation.description = quotation.description;
    if (quotation.stage !== undefined) dbQuotation.stage = quotation.stage;
    if (quotation.probability !== undefined) dbQuotation.probability = quotation.probability;

    // Only add valid_until if it's a non-empty string
    if (quotation.validUntil && quotation.validUntil.trim() !== '') {
      dbQuotation.valid_until = quotation.validUntil;
    }

    // Store items to update after quotation is updated
    const items = quotation.items || [];

    return from(this.supabaseService.supabaseClient
      .from('quotations')
      .update(dbQuotation)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        const updatedQuotation = this.formatQuotationFromDatabase(response.data[0]);

        // If there are items, update them for the quotation
        if (items.length > 0) {
          // First delete existing items
          this.deleteQuotationItems(id).then(() => {
            // Then add the new items
            this.addQuotationItems(id, items);
          });
        }

        // If the quotation status is changed to 'accepted', create an order
        if (dbStatus === 'accepted') {
          // Get the full quotation with items to create the order
          this.getQuotationById(id).subscribe(fullQuotation => {
            this.orderService.createOrderFromQuotation(fullQuotation)
              .subscribe({
                next: (order) => {
                  this.notificationService.success('Order created from accepted quotation');
                },
                error: (error) => {
                  console.error('Error creating order from quotation:', error);
                  this.notificationService.error('Failed to create order from quotation');
                }
              });
          });
        }

        this.notificationService.success('Quotation updated successfully');
        return updatedQuotation;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update quotation: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Add quotation items to the database
  private addQuotationItems(quotationId: string, items: QuotationItem[]): void {
    // Convert items to database format
    const dbItems = items.map(item => ({
      quotation_id: quotationId,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      notes: item.notes || null,
      created_at: new Date().toISOString()
    }));

    // Insert items into the database
    this.supabaseService.supabaseClient
      .from('quotation_items')
      .insert(dbItems)
      .then(response => {
        if (response.error) {
          console.error('Error adding quotation items:', response.error);
          this.notificationService.error('Failed to add products to quotation');
        }
      });
  }

  // Delete all items for a quotation
  private deleteQuotationItems(quotationId: string): Promise<any> {
    // Convert PromiseLike to Promise by wrapping with Promise.resolve()
    return Promise.resolve(
      this.supabaseService.supabaseClient
        .from('quotation_items')
        .delete()
        .eq('quotation_id', quotationId)
    ).then(response => {
      if (response.error) {
        console.error('Error deleting quotation items:', response.error);
        this.notificationService.error('Failed to update quotation products');
      }
      return response;
    });
  }

  // Helper functions to format data
  private formatQuotationFromDatabase(data: any, includeItems: boolean = false): Quotation {
    // Use the status directly from the database
    let status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' = data.status || 'draft';

    // Ensure status is one of our valid statuses
    if (!['draft', 'sent', 'accepted', 'rejected', 'expired'].includes(status)) {
      status = 'draft'; // Default to draft if unknown status
    }

    const quotation: Quotation = {
      id: data.id,
      companyId: data.company_id,
      contactId: data.contact_id,
      title: data.title,
      status: status,
      total: data.total,
      vatRate: data.vat_rate || 20, // Default to 20% if not provided
      vatAmount: data.vat_amount || (data.total * (data.vat_rate || 20) / 100),
      totalWithVat: data.total_with_vat || (data.total + (data.total * (data.vat_rate || 20) / 100)),
      validUntil: data.valid_until,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      items: [] // Initialize items as an empty array
    };

    // Add company if it exists
    if (data.company) {
      quotation.company = {
        id: data.company.id,
        name: data.company.name
      };
    }

    // Add these fields if they exist in the database response
    if (data.description) quotation.description = data.description;
    if (data.stage) quotation.stage = data.stage;
    if (data.probability) quotation.probability = data.probability;

    // Add items if included in the response
    if (includeItems && data.items && Array.isArray(data.items)) {
      console.log(`Processing ${data.items.length} items for quotation ${data.id}`);

      quotation.items = data.items.map((item: any) => {
        // Check if product data is available
        if (!item.product) {
          console.warn(`No product data for item ${item.id} in quotation ${data.id}`);
        } else {
          console.log(`Found product data for item ${item.id}: ${item.product.name}`);
        }

        return {
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
        };
      });

      console.log(`Processed ${quotation.items?.length || 0} items for quotation model`);
    } else {
      console.warn(`Cannot process items for quotation ${data.id}:`, {
        includeItems,
        hasItems: !!data.items,
        isArray: Array.isArray(data.items)
      });
    }

    return quotation;
  }
}
