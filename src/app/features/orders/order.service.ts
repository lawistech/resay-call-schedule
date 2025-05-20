// src/app/features/orders/order.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, throwError, of } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderItem } from '../../core/models/order.model';
import { Opportunity, OpportunityProduct } from '../../core/models/company.model';
import { Quotation, QuotationItem } from '../../core/models/quotation.model';
import { CompanyService } from '../companies/services/company.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private companyService: CompanyService
  ) {}

  getOrders(): Observable<Order[]> {
    return from(this.supabaseService.supabaseClient
      .from('orders')
      .select(`
        *,
        company:companies(id, name)
      `)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(order => this.formatOrderFromDatabase(order));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch orders: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getOrdersByCompany(companyId: string): Observable<Order[]> {
    return from(this.supabaseService.supabaseClient
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(order => this.formatOrderFromDatabase(order, true));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch company orders: ${error.message}`);
        // For development, return mock data if the table doesn't exist yet
        return of(this.getMockOrders(companyId));
      })
    );
  }

  getOrderById(id: string): Observable<Order> {
    return from(this.supabaseService.supabaseClient
      .from('orders')
      .select(`
        *,
        company:companies(id, name),
        items:order_items(
          *,
          product:product_catalog(*)
        )
      `)
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatOrderFromDatabase(response.data, true);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch order: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createOrderFromQuotation(quotation: Quotation, successNotes?: string): Observable<Order> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create orders'));
    }

    // Create order from quotation data
    const order: Partial<Order> = {
      companyId: quotation.companyId,
      contactId: quotation.contactId,
      title: quotation.title,
      status: 'pending',
      total: quotation.total || 0,
      notes: quotation.notes,
      successNotes: successNotes || 'Created from accepted quotation',
      orderDate: new Date().toISOString(),
      lastContactDate: new Date().toISOString()
    };

    const dbOrder = this.formatOrderForDatabase(order);

    // Add created_by and timestamps
    dbOrder.created_by = currentUser.id;
    dbOrder.created_at = new Date().toISOString();

    return from(this.supabaseService.supabaseClient
      .from('orders')
      .insert(dbOrder)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        const createdOrder = this.formatOrderFromDatabase(response.data[0]);

        // If quotation has items, add them as order items
        if (quotation.items && quotation.items.length > 0) {
          this.addOrderItemsFromQuotation(createdOrder.id, quotation.items);
        } else {
          // If no items, create a default order item
          const defaultItem = {
            order_id: createdOrder.id,
            product_id: null,
            product_name: quotation.title,
            quantity: 1,
            price: quotation.total || 0,
            total: quotation.total || 0,
            notes: 'Created from accepted quotation',
            created_at: new Date().toISOString()
          };

          this.supabaseService.supabaseClient
            .from('order_items')
            .insert(defaultItem)
            .then(response => {
              if (response.error) {
                console.error('Error adding default order item:', response.error);
              }
            });
        }

        // Update the company's total order value
        this.updateCompanyTotalOrderValue(quotation.companyId);

        this.notificationService.success('Order created successfully from accepted quotation');
        return createdOrder;
      }),
      catchError(error => {
        console.error('Error creating order from quotation:', error);
        this.notificationService.error(`Failed to create order: ${error.message}`);

        // For development, return a mock order if the table doesn't exist yet
        const mockOrder: Order = {
          id: 'mock-' + Date.now(),
          companyId: quotation.companyId,
          contactId: quotation.contactId,
          title: quotation.title,
          status: 'pending',
          total: quotation.total || 0,
          notes: quotation.notes,
          successNotes: successNotes || 'Created from accepted quotation',
          orderDate: new Date(),
          lastContactDate: new Date(),
          createdAt: new Date()
        };
        return of(mockOrder);
      })
    );
  }

  createOrderFromOpportunity(opportunity: Opportunity, successNotes?: string): Observable<Order> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create orders'));
    }

    // Create order from opportunity data
    const order: Partial<Order> = {
      opportunityId: opportunity.id,
      companyId: opportunity.companyId,
      title: opportunity.title,
      status: 'pending',
      total: opportunity.amount || 0,
      notes: opportunity.notes,
      successNotes: successNotes,
      orderDate: new Date().toISOString(),
      lastContactDate: new Date().toISOString()
    };

    const dbOrder = this.formatOrderForDatabase(order);

    // Add created_by and timestamps
    dbOrder.created_by = currentUser.id;
    dbOrder.created_at = new Date().toISOString();

    return from(this.supabaseService.supabaseClient
      .from('orders')
      .insert(dbOrder)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        const createdOrder = this.formatOrderFromDatabase(response.data[0]);

        // If opportunity has products, add them as order items
        if (opportunity.products && opportunity.products.length > 0) {
          this.addOrderItems(createdOrder.id, opportunity.products);
        } else {
          // If no products, create a default order item
          const defaultItem = {
            order_id: createdOrder.id,
            product_id: null,
            product_name: opportunity.title,
            quantity: 1,
            price: opportunity.amount || 0,
            total: opportunity.amount || 0,
            notes: 'Created from opportunity',
            created_at: new Date().toISOString()
          };

          this.supabaseService.supabaseClient
            .from('order_items')
            .insert(defaultItem)
            .then(response => {
              if (response.error) {
                console.error('Error adding default order item:', response.error);
              }
            });
        }

        // Update the company's total order value
        this.updateCompanyTotalOrderValue(opportunity.companyId);

        this.notificationService.success('Order created successfully');
        return createdOrder;
      }),
      catchError(error => {
        console.error('Error creating order:', error);
        this.notificationService.error(`Failed to create order: ${error.message}`);

        // For development, return a mock order if the table doesn't exist yet
        const mockOrder: Order = {
          id: 'mock-' + Date.now(),
          opportunityId: opportunity.id,
          companyId: opportunity.companyId,
          title: opportunity.title,
          status: 'pending',
          total: opportunity.amount || 0,
          notes: opportunity.notes,
          successNotes: successNotes,
          orderDate: new Date(),
          lastContactDate: new Date(),
          createdAt: new Date()
        };
        return of(mockOrder);
      })
    );
  }

  private addOrderItems(orderId: string, products: OpportunityProduct[]): void {
    const items = products.map(product => ({
      order_id: orderId,
      product_id: product.productId,
      product_name: product.productName,
      quantity: product.quantity,
      price: product.price,
      total: product.total,
      notes: product.notes,
      created_at: new Date().toISOString()
    }));

    this.supabaseService.supabaseClient
      .from('order_items')
      .insert(items)
      .then(response => {
        if (response.error) {
          console.error('Error adding order items:', response.error);
        }
      });
  }

  private addOrderItemsFromQuotation(orderId: string, items: QuotationItem[]): void {
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.product?.name || 'Unknown Product',
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      notes: item.notes || 'Created from quotation item',
      created_at: new Date().toISOString()
    }));

    this.supabaseService.supabaseClient
      .from('order_items')
      .insert(orderItems)
      .then(response => {
        if (response.error) {
          console.error('Error adding order items from quotation:', response.error);
        }
      });
  }

  private updateCompanyTotalOrderValue(companyId: string): void {
    // Use the CompanyService to refresh the company metrics
    this.companyService.calculateCompanyMetrics(companyId).subscribe({
      next: (metrics) => {
        console.log(`Updated total order value for company ${companyId}: ${metrics?.totalOrderValue || 0}`);
      },
      error: (error) => {
        console.error('Error updating company total order value:', error);
      }
    });
  }

  // Helper functions to format data
  private formatOrderFromDatabase(data: any, includeItems: boolean = false): Order {
    const order: Order = {
      id: data.id,
      opportunityId: data.opportunity_id,
      companyId: data.company_id,
      contactId: data.contact_id,
      title: data.title,
      status: data.status,
      total: data.total,
      notes: data.notes,
      successNotes: data.success_notes,
      orderDate: data.order_date,
      completionDate: data.completion_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastContactDate: data.last_contact_date
    };

    // Add items if included in the query
    if (includeItems && data.items) {
      order.items = data.items.map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: item.product_name || (item.product ? item.product.name : ''),
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    }

    return order;
  }

  private formatOrderForDatabase(order: Partial<Order>): any {
    const result: any = {};

    if (order.opportunityId) result.opportunity_id = order.opportunityId;
    if (order.companyId) result.company_id = order.companyId;
    if (order.contactId) result.contact_id = order.contactId;
    if (order.title) result.title = order.title;
    if (order.status) result.status = order.status;
    if (order.total !== undefined) result.total = order.total;
    if (order.notes) result.notes = order.notes;
    if (order.successNotes) result.success_notes = order.successNotes;

    if (order.orderDate) {
      result.order_date = order.orderDate instanceof Date
        ? order.orderDate.toISOString()
        : order.orderDate;
    }

    if (order.completionDate) {
      result.completion_date = order.completionDate instanceof Date
        ? order.completionDate.toISOString()
        : order.completionDate;
    }

    if (order.lastContactDate) {
      result.last_contact_date = order.lastContactDate instanceof Date
        ? order.lastContactDate.toISOString()
        : order.lastContactDate;
    }

    return result;
  }

  // Mock data for development
  private getMockOrders(companyId: string): Order[] {
    return [
      {
        id: 'mock-order-1',
        companyId: companyId,
        title: 'Premium CRM Package',
        status: 'completed',
        total: 2500,
        orderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        completionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        lastContactDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'mock-order-2',
        companyId: companyId,
        title: 'Enterprise Solution',
        status: 'pending',
        total: 5000,
        orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];
  }
}
