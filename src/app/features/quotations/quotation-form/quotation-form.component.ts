// src/app/features/quotations/quotation-form/quotation-form.component.ts
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationService } from '../services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quotation, QuotationItem } from '../../../core/models/quotation.model';
import { CompanyService } from '../../companies/services/company.service';
import { Observable, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductCatalogService } from '../../ecommerce/services/product-catalog.service';
import { ProductCatalog } from '../../ecommerce/models/product-catalog.model';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './quotation-form.component.html',
  styleUrls: ['./quotation-form.component.scss']
})
export class QuotationFormComponent implements OnInit, OnDestroy {
  @Input() quotation: Quotation | null = null;
  @Input() isSaving: boolean = false;
  @Input() preselectedCompanyId: string | null = null;
  @Input() preselectedCompany: any = null;
  @Input() preselectedContactId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<Partial<Quotation>>();

  quotationForm!: FormGroup;
  companyForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  quotationId: string | null = null;
  isEditMode = false;
  companyId: string | null = null;

  // VAT related properties
  defaultVatRate = 20; // Default VAT rate (20%)

  // Company search properties
  companySearchTerm: string = '';
  companySearchResults: any[] = [];
  showCompanySearchResults: boolean = false;
  isSearchingCompany: boolean = false;
  selectedCompany: any | null = null;
  showNewCompanyForm: boolean = false;
  isCreatingCompany: boolean = false;

  // Product selection
  showProductSelector = false;
  products: ProductCatalog[] = [];
  filteredProducts: ProductCatalog[] = [];
  selectedProduct: ProductCatalog | null = null;
  selectedProductQuantity = 1;
  selectedProductPrice = 0;
  selectedProductNotes = '';
  productSearchQuery = '';
  isLoadingProducts = false;
  showCreateProductForm = false;
  newProductName = '';
  newProductSku = '';
  newProductPrice = 0;

  // Form data
  statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed-Won'];
  companies: {id: string, name: string}[] = [];
  contacts: {id: string, first_name: string, last_name: string}[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationService,
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private productCatalogService: ProductCatalogService,
    private supabaseService: SupabaseService
  ) {
    this.quotationForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      companyId: ['', Validators.required],
      contactId: [''],
      status: ['draft', Validators.required],
      stage: ['Prospecting', Validators.required],
      probability: [0, [Validators.min(0), Validators.max(100)]],
      expectedCloseDate: [new Date().toISOString().split('T')[0], Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      vatRate: [this.defaultVatRate, [Validators.required, Validators.min(0), Validators.max(100)]],
      vatAmount: [0],
      totalWithVat: [0],
      notes: [''],
      products: this.fb.array([])
    });

    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      website: [''],
      industry: ['']
    });
  }

  // Getter for products FormArray
  get productsArray(): FormArray {
    return this.quotationForm.get('products') as FormArray;
  }

  ngOnInit(): void {
    // Load companies for dropdown
    this.loadCompanies();

    // Load products for product selector
    this.loadProducts();

    // If we have a preselected company ID, use it
    if (this.preselectedCompanyId) {
      this.companyId = this.preselectedCompanyId;
      this.quotationForm.patchValue({ companyId: this.preselectedCompanyId });
      this.loadContacts(this.preselectedCompanyId);

      // If we also have the preselected company object, set it as the selected company
      if (this.preselectedCompany) {
        this.selectedCompany = this.preselectedCompany;
        console.log('Using preselected company:', this.preselectedCompany.name);
      } else {
        // If we only have the ID but not the company object, load the company details
        this.loadCompanyDetails(this.preselectedCompanyId);
      }
    }

    // Listen for VAT rate changes to recalculate totals
    this.quotationForm.get('vatRate')?.valueChanges.subscribe(value => {
      this.updateTotalAmount();
    });

    // If we have an existing quotation, populate the form
    if (this.quotation) {
      this.patchFormWithQuotation(this.quotation);
    } else if (this.preselectedCompanyId) {
      // If we have a preselected company ID (from modal), we're in create mode
      // No need to check route params in this case
      console.log('Using preselected company ID, skipping route param check');
    } else {
      // Check if we're in edit mode from route params
      this.route.paramMap.subscribe(params => {
        this.quotationId = params.get('id');
        this.isEditMode = !!this.quotationId;

        if (this.isEditMode && this.quotationId) {
          this.loadQuotation(this.quotationId);
        }
      });

      // Check for company_id in query params (for creating from company page)
      this.route.queryParamMap.subscribe(params => {
        const companyId = params.get('company_id');
        if (companyId) {
          this.companyId = companyId;
          this.quotationForm.patchValue({ companyId });

          // Load contacts for this company
          this.loadContacts(companyId);
        }
      });
    }
  }

  loadQuotation(id: string): void {
    this.isLoading = true;
    console.log('QuotationFormComponent: Loading quotation with ID:', id);

    this.quotationService.getQuotationById(id).subscribe({
      next: (quotation) => {
        console.log('QuotationFormComponent: Successfully loaded quotation:', quotation);

        // Check if quotation is accepted - if so, redirect to view page with warning
        if (quotation.status === 'accepted') {
          this.notificationService.warning('This quotation has been accepted and cannot be modified. Accepted quotations count as sales.');
          this.isLoading = false;
          this.router.navigate(['/quotations', id]);
          return;
        }

        this.patchFormWithQuotation(quotation);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('QuotationFormComponent: Error loading quotation:', error);

        // Provide more specific error message based on the error
        if (error.message && error.message.includes('not found')) {
          this.notificationService.error(`Quotation not found. The quotation may have been deleted.`);
        } else if (error.code === 'PGRST116') {
          // This is the Supabase error code for "JSON object requested, multiple (or no) rows returned"
          this.notificationService.error(`Failed to load quotation: The quotation could not be found.`);
        } else {
          this.notificationService.error(`Failed to load quotation: ${error.message || 'Unknown error'}`);
        }

        this.isLoading = false;
        this.router.navigate(['/quotations']);
      }
    });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    const subscription = this.productCatalogService.getProducts()
      .pipe(
        catchError(error => {
          console.error('Error loading products:', error);
          this.notificationService.error('Failed to load products');
          return of([]);
        })
      )
      .subscribe(products => {
        this.products = products;
        this.filteredProducts = [...products];
        this.isLoadingProducts = false;
      });

    this.subscriptions.push(subscription);
  }

  // Product selector methods
  openProductSelector(): void {
    this.showProductSelector = true;
    this.selectedProduct = null;
    this.selectedProductQuantity = 1;
    this.selectedProductPrice = 0;
    this.selectedProductNotes = '';
    this.productSearchQuery = '';
    this.filterProducts();
  }

  closeProductSelector(): void {
    this.showProductSelector = false;
  }

  filterProducts(): void {
    if (!this.productSearchQuery.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const query = this.productSearchQuery.toLowerCase().trim();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query)) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
  }

  selectProduct(product: ProductCatalog): void {
    this.selectedProduct = product;
    this.selectedProductPrice = product.price;
    this.selectedProductQuantity = 1;
    this.selectedProductNotes = '';
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

    this.isLoadingProducts = true;

    // Get the current user's ID for the supplier ID
    this.supabaseService.supabaseClient.auth.getUser().then(({ data }) => {
      const supplierId = data.user?.id || 'default';

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

  // Add product to form

  addSelectedProduct(): void {
    if (!this.selectedProduct) return;

    const total = this.selectedProductQuantity * this.selectedProductPrice;

    const quotationItem: QuotationItem = {
      id: '', // Will be assigned by the database
      quotationId: this.quotationId || '',
      productId: this.selectedProduct.id,
      quantity: this.selectedProductQuantity,
      price: this.selectedProductPrice,
      total: total,
      notes: this.selectedProductNotes,
      product: this.selectedProduct
    };

    this.addProductToForm(quotationItem);
    this.closeProductSelector();
  }

  // Add a product to the form
  addProductToForm(product: QuotationItem): void {
    const productForm = this.fb.group({
      productId: [product.productId, Validators.required],
      productName: [product.product?.name || ''],
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

  // Update the total amount based on products
  updateTotalAmount(): void {
    const total = this.productsArray.controls.reduce((sum, control) => {
      return sum + (control.get('total')?.value || 0);
    }, 0);

    const vatRate = this.quotationForm.get('vatRate')?.value || this.defaultVatRate;
    const vatAmount = total * (vatRate / 100);
    const totalWithVat = total + vatAmount;

    this.quotationForm.patchValue({
      amount: total,
      vatAmount: vatAmount,
      totalWithVat: totalWithVat
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
    this.quotationForm.patchValue({ companyId: '' }); // Clear the company_id in the form

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
    this.quotationForm.patchValue({ companyId: '' });
  }

  // Select a company from search results
  selectCompany(company: any): void {
    this.selectedCompany = company;

    // Update the form with the selected company ID
    this.quotationForm.patchValue({
      companyId: company.id
    });

    // Load contacts for this company
    this.loadContacts(company.id);

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
    } else if (!this.showNewCompanyForm) {
      this.companyForm.reset();
    }
  }

  // Create a new company
  createCompany(): void {
    if (this.companyForm.invalid) {
      return;
    }

    this.isCreatingCompany = true;
    const companyData = this.companyForm.value;

    this.companyService.createCompany(companyData).subscribe({
      next: (company) => {
        this.companies.push(company);
        this.selectCompany(company);
        this.notificationService.success('Company created successfully');
        this.isCreatingCompany = false;
        this.toggleNewCompanyForm();
      },
      error: (error) => {
        console.error('Error creating company:', error);
        this.notificationService.error('Failed to create company');
        this.isCreatingCompany = false;
      }
    });
  }

  // Load companies for dropdown (still needed for backward compatibility)
  loadCompanies(): void {
    const subscription = this.companyService.getCompanies()
      .pipe(
        catchError(error => {
          console.error('Error loading companies:', error);
          this.notificationService.error('Failed to load companies');
          return of([]);
        })
      )
      .subscribe(companies => {
        this.companies = companies;
      });

    this.subscriptions.push(subscription);
  }

  loadContacts(companyId: string): void {
    const subscription = this.companyService.getCompanyContacts(companyId)
      .pipe(
        catchError(error => {
          console.error('Error loading contacts:', error);
          this.notificationService.error('Failed to load contacts');
          return of([]);
        })
      )
      .subscribe(contacts => {
        this.contacts = contacts;

        // Automatically select contact if creating a new quotation
        if (!this.isEditMode && contacts.length > 0) {
          let selectedContact = null;

          // First priority: preselected contact
          if (this.preselectedContactId) {
            selectedContact = contacts.find(contact => contact.id === this.preselectedContactId);
            if (selectedContact) {
              console.log('Using preselected contact:', selectedContact.first_name, selectedContact.last_name);
            }
          }

          // Second priority: primary contact
          if (!selectedContact) {
            selectedContact = contacts.find(contact =>
              contact.job_title?.toLowerCase().includes('primary') ||
              contact.job_title?.toLowerCase().includes('main') ||
              contact.job_title?.toLowerCase().includes('manager') ||
              contact.job_title?.toLowerCase().includes('director')
            ) || contacts[0];

            if (selectedContact) {
              console.log('Auto-selected primary contact:', selectedContact.first_name, selectedContact.last_name);
            }
          }

          if (selectedContact) {
            this.quotationForm.patchValue({ contactId: selectedContact.id });
          }
        }
      });

    this.subscriptions.push(subscription);
  }

  // Load selected company details
  loadCompanyDetails(companyId: string): void {
    const subscription = this.companyService.getCompanyById(companyId)
      .pipe(
        catchError(error => {
          console.error('Error loading company details:', error);
          this.notificationService.error('Failed to load company details');
          return of(null);
        })
      )
      .subscribe(company => {
        if (company) {
          this.selectedCompany = company;
          console.log('Loaded company details:', company.name);
        }
      });

    this.subscriptions.push(subscription);
  }

  patchFormWithQuotation(quotation: Quotation): void {
    // Clear existing products
    while (this.productsArray.length) {
      this.productsArray.removeAt(0);
    }

    // Set basic form values
    this.quotationForm.patchValue({
      title: quotation.title,
      description: quotation.description || '',
      companyId: quotation.companyId,
      contactId: quotation.contactId,
      status: quotation.status,
      stage: quotation.stage || 'Prospecting',
      probability: quotation.probability || 0,
      expectedCloseDate: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
      amount: quotation.total,
      vatRate: quotation.vatRate || this.defaultVatRate,
      vatAmount: quotation.vatAmount || (quotation.total * (quotation.vatRate || this.defaultVatRate) / 100),
      totalWithVat: quotation.totalWithVat || (quotation.total + (quotation.total * (quotation.vatRate || this.defaultVatRate) / 100)),
      notes: quotation.notes || ''
    });

    // Load contacts for this company
    if (quotation.companyId) {
      this.loadContacts(quotation.companyId);
    }

    // Add products if available
    if (quotation.items && quotation.items.length > 0) {
      quotation.items.forEach(item => {
        this.addProductToForm(item);
      });
    }
  }

  onSubmit(): void {
    if (this.quotationForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.quotationForm.controls).forEach(key => {
        const control = this.quotationForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSaving = true;

    // Get form values and prepare data for submission
    const formValues = this.quotationForm.value;

    // Create a clean data object for submission
    const formData: Partial<Quotation> = {
      title: formValues.title,
      description: formValues.description,
      companyId: formValues.companyId,
      status: formValues.status || 'draft',
      stage: formValues.stage,
      probability: formValues.probability,
      total: formValues.amount || 0,
      vatRate: formValues.vatRate || this.defaultVatRate,
      vatAmount: formValues.vatAmount || 0,
      totalWithVat: formValues.totalWithVat || 0,
      notes: formValues.notes
    };

    // If the stage is Closed-Won, auto-set status to Won
    if (formValues.stage === 'Closed-Won') {
      formData.status = 'accepted';
    }

    // Only add optional fields if they have values
    if (formValues.contactId) {
      formData.contactId = formValues.contactId;
    }

    // Handle the date field properly
    if (formValues.expectedCloseDate) {
      // Convert to ISO string for database
      formData.validUntil = new Date(formValues.expectedCloseDate).toISOString();
    }

    // Add products
    if (this.productsArray.length > 0) {
      formData.items = this.productsArray.controls.map(control => {
        const productValue = control.value;
        return {
          id: '',
          quotationId: this.quotationId || '',
          productId: productValue.productId,
          quantity: productValue.quantity,
          price: productValue.price,
          total: productValue.total,
          notes: productValue.notes
        };
      });
    }

    // If we're using the component with @Input/@Output
    if (this.formSubmitted.observed) {
      this.formSubmitted.emit(formData);
      return;
    }

    // Otherwise, handle the form submission directly
    if (this.isEditMode && this.quotationId) {
      // Update existing quotation
      this.quotationService.updateQuotation(this.quotationId, formData).subscribe({
        next: () => {
          this.notificationService.success('Quotation updated successfully');
          this.router.navigate(['/quotations', this.quotationId]);
          this.isSaving = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to update quotation');
          this.isSaving = false;
        }
      });
    } else {
      // Create new quotation
      this.quotationService.createQuotation(formData).subscribe({
        next: (quotation) => {
          this.notificationService.success('Quotation created successfully');
          this.router.navigate(['/quotations', quotation.id]);
          this.isSaving = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to create quotation');
          this.isSaving = false;
        }
      });
    }
  }

  onCancel(): void {
    // If we're using the component with @Input/@Output
    if (this.close.observed) {
      this.close.emit();
      return;
    }

    // Otherwise, handle navigation directly
    this.goBack();
  }

  goBack(): void {
    if (this.isEditMode && this.quotationId) {
      this.router.navigate(['/quotations', this.quotationId]);
    } else if (this.companyId) {
      this.router.navigate(['/companies', this.companyId], { queryParams: { tab: 'opportunities' } });
    } else {
      this.router.navigate(['/quotations']);
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
