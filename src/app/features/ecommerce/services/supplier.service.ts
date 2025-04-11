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

        // Convert snake_case to camelCase for frontend
        return response.data.map(dbSupplier => ({
          id: dbSupplier.id,
          name: dbSupplier.name,
          contactName: dbSupplier.contact_name,
          email: dbSupplier.email,
          phone: dbSupplier.phone,
          website: dbSupplier.website,
          address: dbSupplier.address,
          notes: dbSupplier.notes,
          isActive: dbSupplier.is_active,
          createdAt: dbSupplier.created_at,
          updatedAt: dbSupplier.updated_at
        }));
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

        // Convert snake_case to camelCase for frontend
        const dbSupplier = response.data;
        return {
          id: dbSupplier.id,
          name: dbSupplier.name,
          contactName: dbSupplier.contact_name,
          email: dbSupplier.email,
          phone: dbSupplier.phone,
          website: dbSupplier.website,
          address: dbSupplier.address,
          notes: dbSupplier.notes,
          isActive: dbSupplier.is_active,
          createdAt: dbSupplier.created_at,
          updatedAt: dbSupplier.updated_at
        };
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

    // Convert camelCase to snake_case for database
    const dbSupplier = {
      name: supplier.name,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      website: supplier.website,
      address: supplier.address,
      notes: supplier.notes,
      is_active: supplier.isActive
    };

    return from(this.supabaseService.supabaseClient
      .from('suppliers')
      .insert(dbSupplier)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Supplier created successfully');

        // Convert snake_case to camelCase for frontend
        const dbSupplier = response.data[0];
        return {
          id: dbSupplier.id,
          name: dbSupplier.name,
          contactName: dbSupplier.contact_name,
          email: dbSupplier.email,
          phone: dbSupplier.phone,
          website: dbSupplier.website,
          address: dbSupplier.address,
          notes: dbSupplier.notes,
          isActive: dbSupplier.is_active,
          createdAt: dbSupplier.created_at,
          updatedAt: dbSupplier.updated_at
        };
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create supplier: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
    // Convert camelCase to snake_case for database
    const dbSupplier: any = {};

    if (supplier.name !== undefined) dbSupplier.name = supplier.name;
    if (supplier.contactName !== undefined) dbSupplier.contact_name = supplier.contactName;
    if (supplier.email !== undefined) dbSupplier.email = supplier.email;
    if (supplier.phone !== undefined) dbSupplier.phone = supplier.phone;
    if (supplier.website !== undefined) dbSupplier.website = supplier.website;
    if (supplier.address !== undefined) dbSupplier.address = supplier.address;
    if (supplier.notes !== undefined) dbSupplier.notes = supplier.notes;
    if (supplier.isActive !== undefined) dbSupplier.is_active = supplier.isActive;

    return from(this.supabaseService.supabaseClient
      .from('suppliers')
      .update(dbSupplier)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Supplier updated successfully');

        // Convert snake_case to camelCase for frontend
        const dbSupplier = response.data[0];
        return {
          id: dbSupplier.id,
          name: dbSupplier.name,
          contactName: dbSupplier.contact_name,
          email: dbSupplier.email,
          phone: dbSupplier.phone,
          website: dbSupplier.website,
          address: dbSupplier.address,
          notes: dbSupplier.notes,
          isActive: dbSupplier.is_active,
          createdAt: dbSupplier.created_at,
          updatedAt: dbSupplier.updated_at
        };
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
