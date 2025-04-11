// src/app/features/ecommerce/services/product-catalog.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProductCatalog } from '../models/product-catalog.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductCatalogService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  getProducts(): Observable<ProductCatalog[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_catalog')
      .select(`
        *,
        suppliers(id, name)
      `)
      .order('name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Convert snake_case to camelCase for frontend
        return response.data.map(dbProduct => ({
          id: dbProduct.id,
          supplierId: dbProduct.supplier_id,
          supplierName: dbProduct.suppliers ? dbProduct.suppliers.name : undefined,
          name: dbProduct.name,
          sku: dbProduct.sku,
          description: dbProduct.description,
          price: dbProduct.price,
          cost: dbProduct.cost,
          stockQuantity: dbProduct.stock_quantity,
          category: dbProduct.category,
          tags: dbProduct.tags,
          imageUrl: dbProduct.image_url,
          isActive: dbProduct.is_active,
          createdAt: dbProduct.created_at,
          updatedAt: dbProduct.updated_at
        }));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch products: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getProductById(id: string): Observable<ProductCatalog> {
    return from(this.supabaseService.supabaseClient
      .from('product_catalog')
      .select(`
        *,
        suppliers(id, name)
      `)
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Convert snake_case to camelCase for frontend
        const dbProduct = response.data;
        return {
          id: dbProduct.id,
          supplierId: dbProduct.supplier_id,
          supplierName: dbProduct.suppliers ? dbProduct.suppliers.name : undefined,
          name: dbProduct.name,
          sku: dbProduct.sku,
          description: dbProduct.description,
          price: dbProduct.price,
          cost: dbProduct.cost,
          stockQuantity: dbProduct.stock_quantity,
          category: dbProduct.category,
          tags: dbProduct.tags,
          imageUrl: dbProduct.image_url,
          isActive: dbProduct.is_active,
          createdAt: dbProduct.created_at,
          updatedAt: dbProduct.updated_at
        };
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch product: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createProduct(product: Omit<ProductCatalog, 'id' | 'createdAt' | 'updatedAt'>): Observable<ProductCatalog> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create products'));
    }

    // Remove supplierName as it's not a database field
    const { supplierName, ...productData } = product as any;

    // Convert camelCase to snake_case for database
    const dbProduct = {
      supplier_id: productData.supplierId,
      name: productData.name,
      sku: productData.sku,
      description: productData.description,
      price: productData.price,
      cost: productData.cost,
      stock_quantity: productData.stockQuantity,
      category: productData.category,
      tags: productData.tags,
      image_url: productData.imageUrl,
      is_active: productData.isActive
    };

    return from(this.supabaseService.supabaseClient
      .from('product_catalog')
      .insert(dbProduct)
      .select(`
        *,
        suppliers(id, name)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Product created successfully');

        // Convert snake_case to camelCase for frontend
        const dbProduct = response.data[0];
        return {
          id: dbProduct.id,
          supplierId: dbProduct.supplier_id,
          supplierName: dbProduct.suppliers ? dbProduct.suppliers.name : undefined,
          name: dbProduct.name,
          sku: dbProduct.sku,
          description: dbProduct.description,
          price: dbProduct.price,
          cost: dbProduct.cost,
          stockQuantity: dbProduct.stock_quantity,
          category: dbProduct.category,
          tags: dbProduct.tags,
          imageUrl: dbProduct.image_url,
          isActive: dbProduct.is_active,
          createdAt: dbProduct.created_at,
          updatedAt: dbProduct.updated_at
        };
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create product: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateProduct(id: string, product: Partial<ProductCatalog>): Observable<ProductCatalog> {
    // Remove supplierName as it's not a database field
    const { supplierName, ...productData } = product as any;

    // Convert camelCase to snake_case for database
    const dbProduct: any = {};

    if (productData.supplierId !== undefined) dbProduct.supplier_id = productData.supplierId;
    if (productData.name !== undefined) dbProduct.name = productData.name;
    if (productData.sku !== undefined) dbProduct.sku = productData.sku;
    if (productData.description !== undefined) dbProduct.description = productData.description;
    if (productData.price !== undefined) dbProduct.price = productData.price;
    if (productData.cost !== undefined) dbProduct.cost = productData.cost;
    if (productData.stockQuantity !== undefined) dbProduct.stock_quantity = productData.stockQuantity;
    if (productData.category !== undefined) dbProduct.category = productData.category;
    if (productData.tags !== undefined) dbProduct.tags = productData.tags;
    if (productData.imageUrl !== undefined) dbProduct.image_url = productData.imageUrl;
    if (productData.isActive !== undefined) dbProduct.is_active = productData.isActive;

    return from(this.supabaseService.supabaseClient
      .from('product_catalog')
      .update(dbProduct)
      .eq('id', id)
      .select(`
        *,
        suppliers(id, name)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Product updated successfully');

        // Convert snake_case to camelCase for frontend
        const dbProduct = response.data[0];
        return {
          id: dbProduct.id,
          supplierId: dbProduct.supplier_id,
          supplierName: dbProduct.suppliers ? dbProduct.suppliers.name : undefined,
          name: dbProduct.name,
          sku: dbProduct.sku,
          description: dbProduct.description,
          price: dbProduct.price,
          cost: dbProduct.cost,
          stockQuantity: dbProduct.stock_quantity,
          category: dbProduct.category,
          tags: dbProduct.tags,
          imageUrl: dbProduct.image_url,
          isActive: dbProduct.is_active,
          createdAt: dbProduct.created_at,
          updatedAt: dbProduct.updated_at
        };
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update product: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('product_catalog')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Product deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete product: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Method to get products by supplier
  getProductsBySupplier(supplierId: string): Observable<ProductCatalog[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_catalog')
      .select(`
        *,
        suppliers(id, name)
      `)
      .eq('supplierId', supplierId)
      .order('name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Format the data to include supplier name
        return response.data.map(product => ({
          ...product,
          supplierName: product.suppliers ? product.suppliers.name : undefined
        }));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch products: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Method to attach a product to a quotation
  attachProductToQuotation(productId: string, quotationId: string, quantity: number, price: number): Observable<any> {
    const attachment = {
      productId,
      quotationId,
      quantity,
      price,
      total: quantity * price
    };

    return from(this.supabaseService.supabaseClient
      .from('quotation_products')
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
}
