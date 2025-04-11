// src/app/features/ecommerce/services/supplier.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Supplier } from '../models/supplier.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  getSuppliers(): Observable<Supplier[]> {
    return from(this.supabaseService.supabaseClient
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch suppliers: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getSupplierById(id: string): Observable<Supplier> {
    return from(this.supabaseService.supabaseClient
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch supplier: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Observable<Supplier> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create suppliers'));
    }
    
    return from(this.supabaseService.supabaseClient
      .from('suppliers')
      .insert(supplier)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Supplier created successfully');
        return response.data[0];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create supplier: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
    return from(this.supabaseService.supabaseClient
      .from('suppliers')
      .update(supplier)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Supplier updated successfully');
        return response.data[0];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update supplier: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteSupplier(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('suppliers')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Supplier deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete supplier: ${error.message}`);
        return throwError(() => error);
      })
    );
  }
}
