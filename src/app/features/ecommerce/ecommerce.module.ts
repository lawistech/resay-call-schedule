// src/app/features/ecommerce/ecommerce.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { EcommerceComponent } from './ecommerce.component';
import { ProductsComponent } from './products/products.component';
import { ProductDetailComponent } from './products/product-detail/product-detail.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { SupplierService } from './services/supplier.service';
import { ProductCatalogService } from './services/product-catalog.service';
import { ProductAttachmentService } from './services/product-attachment.service';

const routes: Routes = [
  { path: '', component: EcommerceComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'suppliers', component: SuppliersComponent },
  { path: 'product-catalog', component: ProductCatalogComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    ProductsComponent,
    ProductDetailComponent,
    SuppliersComponent,
    ProductCatalogComponent
  ],
  providers: [
    SupplierService,
    ProductCatalogService,
    ProductAttachmentService
  ]
})
export class EcommerceModule { }
