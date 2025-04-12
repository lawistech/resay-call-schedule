// src/app/features/opportunities/opportunity-form/opportunity-form.component.ts
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Opportunity, OpportunityProduct, Company } from '../../../core/models/company.model';
import { OpportunitiesService } from '../opportunities.service';
import { ProductCatalog } from '../../../features/ecommerce/models/product-catalog.model';
import { ProductCatalogService } from '../../../features/ecommerce/services/product-catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CompanyService } from '../../companies/services/company.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

  // Company search properties
  companySearchTerm: string = '';
  companySearchResults: Company[] = [];
  showCompanySearchResults: boolean = false;
  isSearchingCompany: boolean = false;
  selectedCompany: Company | null = null;
  companyForm: FormGroup;
  showNewCompanyForm: boolean = false;

  // Product-related properties
  products: ProductCatalog[] = [];
  filteredProducts: ProductCatalog[] = [];
  isLoadingProducts = false;
  selectedProduct: ProductCatalog | null = null;
  productQuantity = 1;
  productPrice = 0;
  productNotes = '';
  showProductSelector = false;
  productSearchQuery = '';
  showCreateProductForm = false;
  newProductName = '';
  newProductSku = '';
  newProductPrice = 0;

  constructor(
    private fb: FormBuilder,
    private opportunitiesService: OpportunitiesService,
    private productCatalogService: ProductCatalogService,
    private notificationService: NotificationService,
    private supabaseService: SupabaseService,
    private companyService: CompanyService
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

    // Initialize company form
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      industry: [''],
      website: [''],
      address: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
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

      // Load the company details to display in the search input
      if (this.opportunity.companyId) {
        this.loadSelectedCompany(this.opportunity.companyId);
      }

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

      // Load the company details to display in the search input
      this.loadSelectedCompany(this.preselectedCompanyId);
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

  ngOnDestroy(): void {
    // Restore body scrolling when component is destroyed
    document.body.style.overflow = '';
  }

  // Format date for input field
  formatDateForInput(date: string | Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Load selected company details
  loadSelectedCompany(companyId: string): void {
    this.isLoadingCompanies = true;
    this.companyService.getCompanyById(companyId).subscribe({
      next: (company) => {
        this.selectedCompany = company;
        this.companySearchTerm = company.name;
        this.isLoadingCompanies = false;
      },
      error: (error) => {
        console.error('Error loading company:', error);
        this.isLoadingCompanies = false;
      }
    });
  }

  // Search for companies
  searchCompanies(searchTerm: string): void {
    this.isSearchingCompany = true;

    this.companyService.searchCompanies(searchTerm).subscribe({
      next: (companies) => {
        this.companySearchResults = companies;
        this.showCompanySearchResults = companies.length > 0;
        this.isSearchingCompany = false;

        // If there's an exact match, select it automatically
        const exactMatch = companies.find(c =>
          c.name.toLowerCase() === searchTerm.toLowerCase());
        if (exactMatch) {
          this.selectCompany(exactMatch);
        }
      },
      error: (error) => {
        console.error('Error searching companies:', error);
        this.isSearchingCompany = false;
      }
    });
  }

  // Handle company search input changes
  onCompanySearchChange(value: string): void {
    this.companySearchTerm = value;
    this.selectedCompany = null; // Clear selected company when search term changes
    this.opportunityForm.patchValue({ companyId: '' }); // Clear the company_id in the form

    if (value && value.length > 1) {
      this.searchCompanies(value);
    } else {
      this.companySearchResults = [];
      this.showCompanySearchResults = false;
    }
  }

  // Clear company search
  clearCompanySearch(): void {
    this.companySearchTerm = '';
    this.selectedCompany = null;
    this.companySearchResults = [];
    this.showCompanySearchResults = false;
    this.opportunityForm.patchValue({ companyId: '' });
  }

  // Select a company from search results
  selectCompany(company: Company): void {
    this.selectedCompany = company;

    // Update the form with the selected company ID
    this.opportunityForm.patchValue({
      companyId: company.id
    });

    // Hide search results
    this.showCompanySearchResults = false;

    // Show notification
    this.notificationService.info(`Selected company: ${company.name}`);
  }

  // Toggle new company form
  toggleNewCompanyForm(): void {
    this.showNewCompanyForm = !this.showNewCompanyForm;

    if (this.showNewCompanyForm && this.companySearchTerm) {
      // Pre-fill the company name field with the search term
      this.companyForm.patchValue({
        name: this.companySearchTerm
      });
    }
  }

  // Create a new company
  createNewCompany(): void {
    if (!this.companySearchTerm || this.companySearchTerm.trim().length < 2) {
      this.notificationService.error('Please enter a valid company name');
      return;
    }

    // Check if a company with this name already exists
    this.companyService.checkDuplicateCompany(this.companySearchTerm).subscribe({
      next: (companies) => {
        if (companies.length > 0) {
          // Company already exists, ask user to select it
          this.notificationService.warning(`A company named "${companies[0].name}" already exists. Please select it from the list.`);
          this.companySearchResults = companies;
          this.showCompanySearchResults = true;
        } else {
          // Create new company
          this.companyForm.patchValue({
            name: this.companySearchTerm
          });
          this.toggleNewCompanyForm();
        }
      },
      error: (error) => {
        console.error('Error checking duplicate company:', error);
        this.notificationService.error('Error checking for existing companies');
      }
    });
  }

  // Create company from form
  createCompany(): void {
    if (this.companyForm.invalid) {
      return;
    }

    this.isLoadingCompanies = true;

    this.companyService.createCompany(this.companyForm.value).subscribe({
      next: (company) => {
        this.selectedCompany = company;
        this.companySearchTerm = company.name;
        this.opportunityForm.patchValue({ companyId: company.id });
        this.notificationService.success('Company created successfully');
        this.showNewCompanyForm = false;
        this.isLoadingCompanies = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to create company: ' + error.message);
        this.isLoadingCompanies = false;
      }
    });
  }

  // Cancel form submission
  onCancel(): void {
    // Restore body scrolling when modal is closed
    document.body.style.overflow = '';
    this.close.emit();
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
        this.filteredProducts = [...products];
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.notificationService.error('Failed to load products');
        this.isLoadingProducts = false;
      }
    });
  }

  // Search products based on query
  searchProducts(): void {
    if (!this.productSearchQuery.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const query = this.productSearchQuery.toLowerCase().trim();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query)) ||
      product.description?.toLowerCase().includes(query)
    );
  }

  // Toggle create product form
  toggleCreateProductForm(): void {
    this.showCreateProductForm = !this.showCreateProductForm;
    if (this.showCreateProductForm) {
      // Pre-populate the new product name with the search query if it exists
      this.newProductName = this.productSearchQuery;
      this.newProductSku = '';
      this.newProductPrice = 0;
    }
  }

  // Create a new product
  createProduct(): void {
    if (!this.newProductName.trim()) {
      this.notificationService.error('Product name is required');
      return;
    }

    // Get the first supplier ID for simplicity
    // In a real application, you might want to let the user select a supplier
    this.isLoadingProducts = true;
    this.supabaseService.supabaseClient
      .from('suppliers')
      .select('id')
      .limit(1)
      .then((response: any) => {
        if (response.error) {
          this.notificationService.error('Failed to get supplier');
          this.isLoadingProducts = false;
          return;
        }

        const supplierId = response.data && response.data.length > 0 ? response.data[0].id : null;

        if (!supplierId) {
          this.notificationService.error('No supplier found. Please create a supplier first.');
          this.isLoadingProducts = false;
          return;
        }

        const newProduct = {
          supplierId: supplierId,
          name: this.newProductName.trim(),
          sku: this.newProductSku.trim() || `SKU-${Date.now()}`,
          price: this.newProductPrice,
          description: '',
          isActive: true
        };

        this.productCatalogService.createProduct(newProduct).subscribe({
          next: (createdProduct) => {
            this.products.push(createdProduct);
            this.filteredProducts = [...this.products];
            this.notificationService.success('Product created successfully');
            this.selectProduct(createdProduct);
            this.showCreateProductForm = false;
            this.productSearchQuery = '';
            this.isLoadingProducts = false;
          },
          error: (error) => {
            console.error('Error creating product:', error);
            this.notificationService.error('Failed to create product');
            this.isLoadingProducts = false;
          }
        });
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
    this.productSearchQuery = '';
    this.showCreateProductForm = false;
    this.filteredProducts = [...this.products];
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

  // Submit the form
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
}
