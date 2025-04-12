// src/app/features/ecommerce/ecommerce.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Removed WooCommerce components
import { SuppliersComponent } from './suppliers/suppliers.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { TestProductImportComponent } from './product-catalog/test-product-import.component';
import { SupplierService } from './services/supplier.service';
import { ProductCatalogService } from './services/product-catalog.service';
import { ProductAttachmentService } from './services/product-attachment.service';

const routes: Routes = [
  { path: '', redirectTo: 'product-catalog', pathMatch: 'full' },
  { path: 'suppliers', component: SuppliersComponent },
  { path: 'product-catalog', component: ProductCatalogComponent },
  { path: 'test-import', component: TestProductImportComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    SuppliersComponent,
    ProductCatalogComponent,
    TestProductImportComponent
  ],
  providers: [
    SupplierService,
    ProductCatalogService,
    ProductAttachmentService
  ]
})
export class EcommerceModule { }
