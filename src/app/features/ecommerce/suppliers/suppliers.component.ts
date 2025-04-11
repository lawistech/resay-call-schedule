// src/app/features/ecommerce/suppliers/suppliers.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierService } from '../services/supplier.service';
import { Supplier } from '../models/supplier.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  isLoading = true;
  showForm = false;
  isEditing = false;
  currentSupplier: Supplier | null = null;
  supplierForm: FormGroup;
  searchTerm = '';
  filteredSuppliers: Supplier[] = [];

  constructor(
    private supplierService: SupplierService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required]],
      contactName: [''],
      email: ['', [Validators.email]],
      phone: [''],
      website: [''],
      address: [''],
      notes: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading = true;
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.filteredSuppliers = suppliers;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.isLoading = false;
      }
    });
  }

  filterSuppliers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSuppliers = this.suppliers;
      return;
    }

    const search = this.searchTerm.toLowerCase().trim();
    this.filteredSuppliers = this.suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(search) ||
      (supplier.contactName && supplier.contactName.toLowerCase().includes(search)) ||
      (supplier.email && supplier.email.toLowerCase().includes(search))
    );
  }

  openForm(supplier?: Supplier): void {
    this.showForm = true;
    this.isEditing = !!supplier;
    this.currentSupplier = supplier || null;

    if (supplier) {
      this.supplierForm.patchValue({
        name: supplier.name,
        contactName: supplier.contactName || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive
      });
    } else {
      this.supplierForm.reset({
        isActive: true
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.currentSupplier = null;
    this.supplierForm.reset({
      isActive: true
    });
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const supplierData = this.supplierForm.value;

    if (this.isEditing && this.currentSupplier) {
      this.supplierService.updateSupplier(this.currentSupplier.id, supplierData).subscribe({
        next: () => {
          this.loadSuppliers();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error updating supplier:', error);
        }
      });
    } else {
      this.supplierService.createSupplier(supplierData).subscribe({
        next: () => {
          this.loadSuppliers();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error creating supplier:', error);
        }
      });
    }
  }

  deleteSupplier(supplier: Supplier): void {
    if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      this.supplierService.deleteSupplier(supplier.id).subscribe({
        next: () => {
          this.loadSuppliers();
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
        }
      });
    }
  }
}
