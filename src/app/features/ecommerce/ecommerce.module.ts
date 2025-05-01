// src/app/features/ecommerce/ecommerce.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Components
import { SuppliersComponent } from './suppliers/suppliers.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { TestProductImportComponent } from './product-catalog/test-product-import.component';
import { OrdersComponent } from './orders/orders.component';
import { ProductKnowledgeBaseComponent } from './product-knowledge-base/product-knowledge-base.component';
import { KnowledgeBaseViewerComponent } from './product-knowledge-base/knowledge-base-viewer.component';
import { KnowledgeBaseAnalyticsComponent } from './product-knowledge-base/knowledge-base-analytics.component';

// Services
import { SupplierService } from './services/supplier.service';
import { ProductCatalogService } from './services/product-catalog.service';
import { ProductAttachmentService } from './services/product-attachment.service';
import { ProductKnowledgeBaseService } from './services/product-knowledge-base.service';
import { OrderService } from '../orders/order.service';

const routes: Routes = [
  { path: '', redirectTo: 'product-catalog', pathMatch: 'full' },
  { path: 'suppliers', component: SuppliersComponent },
  { path: 'product-catalog', component: ProductCatalogComponent },
  { path: 'test-import', component: TestProductImportComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'knowledge-base', component: KnowledgeBaseViewerComponent },
  { path: 'knowledge-base/manage', component: ProductKnowledgeBaseComponent },
  { path: 'knowledge-base/analytics', component: KnowledgeBaseAnalyticsComponent }
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
    TestProductImportComponent,
    OrdersComponent,
    ProductKnowledgeBaseComponent,
    KnowledgeBaseViewerComponent,
    KnowledgeBaseAnalyticsComponent
  ],
  providers: [
    SupplierService,
    ProductCatalogService,
    ProductAttachmentService,
    ProductKnowledgeBaseService,
    OrderService
  ]
})
export class EcommerceModule { }
