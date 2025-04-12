// src/app/features/opportunities/opportunity-form/opportunity-form.component.ts
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Opportunity, OpportunityProduct } from '../../../core/models/company.model';
import { OpportunitiesService } from '../opportunities.service';
import { ProductCatalog } from '../../../features/ecommerce/models/product-catalog.model';
import { ProductCatalogService } from '../../../features/ecommerce/services/product-catalog.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './opportunity-form.component.html',
  styleUrls: ['./opportunity-form.component.css']
})
export class OpportunityFormComponent implements OnInit, OnDestroy {
  @Input() opportunity: Opportunity | null = null;
  @Input() isSaving: boolean = false;
  @Input() preselectedCompanyId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<Partial<Opportunity>>();

  opportunityForm: FormGroup;
  stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed-Won'];
  statuses = ['New', 'In Progress', 'Won', 'Lost'];
  companies: {id: string, name: string}[] = [];
  isLoadingCompanies = false;

  // Product-related properties
  products: ProductCatalog[] = [];
  isLoadingProducts = false;
  selectedProduct: ProductCatalog | null = null;
  productQuantity = 1;
  productPrice = 0;
  productNotes = '';
  showProductSelector = false;

  constructor(
    private fb: FormBuilder,
    private opportunitiesService: OpportunitiesService,
    private productCatalogService: ProductCatalogService,
    private notificationService: NotificationService
  ) {
    this.opportunityForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['New', Validators.required],
      stage: ['Prospecting', Validators.required],
      probability: [0, [Validators.min(0), Validators.max(100)]],
      expectedCloseDate: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      companyId: ['', Validators.required],
      notes: [''],
      products: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadProducts();

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    if (this.opportunity) {
      // For edit mode, populate the form with opportunity data
      this.opportunityForm.patchValue({
        title: this.opportunity.title,
        description: this.opportunity.description,
        status: this.opportunity.status,
        stage: this.opportunity.stage,
        probability: this.opportunity.probability,
        expectedCloseDate: this.formatDateForInput(this.opportunity.expectedCloseDate),
        amount: this.opportunity.amount,
        companyId: this.opportunity.companyId,
        notes: this.opportunity.notes
      });

      // Add existing products if any
      if (this.opportunity.products && this.opportunity.products.length > 0) {
        this.opportunity.products.forEach(product => {
          this.addProductToForm(product);
        });
      }
    } else if (this.preselectedCompanyId) {
      // If we have a preselected company ID (from query params), set it
      this.opportunityForm.patchValue({
        companyId: this.preselectedCompanyId
      });
    }

    // Auto-adjust probability based on stage selection
    this.opportunityForm.get('stage')?.valueChanges.subscribe(stage => {
      if (!this.opportunityForm.get('probability')?.dirty) {
        // Only auto-set if user hasn't manually changed the probability
        let probability = 0;
        switch(stage) {
          case 'Prospecting': probability = 20; break;
          case 'Discovery': probability = 40; break;
          case 'Proposal': probability = 60; break;
          case 'Negotiation': probability = 80; break;
          case 'Closed-Won': probability = 100; break;
        }
        this.opportunityForm.get('probability')?.setValue(probability);
      }
    });
  }

  // Get the products FormArray
  get productsArray(): FormArray {
    return this.opportunityForm.get('products') as FormArray;
  }

  // Load products from the catalog
  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productCatalogService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.notificationService.error('Failed to load products');
        this.isLoadingProducts = false;
      }
    });
  }

  // Add a product to the form
  addProductToForm(product: OpportunityProduct): void {
    const productForm = this.fb.group({
      productId: [product.productId, Validators.required],
      productName: [product.productName || ''],
      quantity: [product.quantity, [Validators.required, Validators.min(1)]],
      price: [product.price, [Validators.required, Validators.min(0)]],
      total: [product.total],
      notes: [product.notes || '']
    });

    this.productsArray.push(productForm);
    this.updateTotalAmount();
  }

  // Remove a product from the form
  removeProduct(index: number): void {
    this.productsArray.removeAt(index);
    this.updateTotalAmount();
  }

  // Show product selector
  openProductSelector(): void {
    this.showProductSelector = true;
    this.selectedProduct = null;
    this.productQuantity = 1;
    this.productPrice = 0;
    this.productNotes = '';
  }

  // Close product selector
  closeProductSelector(): void {
    this.showProductSelector = false;
    // Don't restore body scrolling here as the main modal is still open
  }

  // Select a product
  selectProduct(product: ProductCatalog): void {
    this.selectedProduct = product;
    this.productPrice = product.price;
  }

  // Add the selected product to the opportunity
  addSelectedProduct(): void {
    if (!this.selectedProduct) {
      this.notificationService.error('Please select a product');
      return;
    }

    const product: OpportunityProduct = {
      productId: this.selectedProduct.id,
      productName: this.selectedProduct.name,
      quantity: this.productQuantity,
      price: this.productPrice,
      total: this.productQuantity * this.productPrice,
      notes: this.productNotes
    };

    this.addProductToForm(product);
    this.closeProductSelector();
  }

  // Update the total amount based on products
  updateTotalAmount(): void {
    let total = 0;
    for (let i = 0; i < this.productsArray.length; i++) {
      const product = this.productsArray.at(i).value;
      total += product.total;
    }
    this.opportunityForm.get('amount')?.setValue(total);
  }

  loadCompanies(): void {
    this.isLoadingCompanies = true;
    this.opportunitiesService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
        this.isLoadingCompanies = false;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.isLoadingCompanies = false;
      }
    });
  }

  onSubmit(): void {
    if (this.opportunityForm.valid) {
      const formValue = this.opportunityForm.value;

      // Create the opportunity data object
      const opportunityData: Partial<Opportunity> = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        stage: formValue.stage,
        probability: formValue.probability,
        expectedCloseDate: new Date(formValue.expectedCloseDate),
        amount: formValue.amount,
        companyId: formValue.companyId,
        notes: formValue.notes,
        products: formValue.products
      };

      // If the stage is Closed-Won, auto-set status to Won
      if (formValue.stage === 'Closed-Won') {
        opportunityData.status = 'Won';
      }

      // If editing, add the ID
      if (this.opportunity && this.opportunity.id) {
        opportunityData.id = this.opportunity.id;
      }

      // Restore body scrolling before emitting the event
      document.body.style.overflow = '';
      this.formSubmitted.emit(opportunityData);
    } else {
      // Mark all form controls as touched to show validation errors
      this.markFormGroupTouched(this.opportunityForm);
      this.notificationService.error('Please fill in all required fields');
    }
  }

  // Helper method to mark all controls in a form group as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel(): void {
    // Restore body scrolling when modal is closed
    document.body.style.overflow = '';
    this.close.emit();
  }

  ngOnDestroy(): void {
    // Restore body scrolling when component is destroyed
    document.body.style.overflow = '';
  }

  // Helper function to format date for input field
  private formatDateForInput(date: Date | string | undefined): string | null {
    if (!date) return null;

    const d = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return null;

    // Format as YYYY-MM-DD for the input[type="date"]
    return d.toISOString().split('T')[0];
  }
}