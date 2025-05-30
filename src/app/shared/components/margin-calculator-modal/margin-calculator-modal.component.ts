// src/app/shared/components/margin-calculator-modal/margin-calculator-modal.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductCatalog } from '../../../features/ecommerce/models/product-catalog.model';
import { ProductCatalogService } from '../../../features/ecommerce/services/product-catalog.service';
import { MarginCalculatorService } from '../../../features/quotations/services/margin-calculator.service';
import { MarginStateService } from '../../../core/services/margin-state.service';
import { MarginPanelService } from '../../../core/services/margin-panel.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

export interface MarginCalculationRow {
  product: ProductCatalog;
  quantity: number;
  costPrice: number;
  sellingPrices: { [marginPercentage: number]: number };
  profits: { [marginPercentage: number]: number };
  bundlePrice?: number;
}

@Component({
  selector: 'app-margin-calculator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './margin-calculator-modal.component.html',
  styleUrls: ['./margin-calculator-modal.component.scss']
})
export class MarginCalculatorModalComponent implements OnInit, OnDestroy {
  // Remove @Input() isVisible to prevent conflicts with service state
  isVisible = false;
  @Output() closeModal = new EventEmitter<void>();

  // Form for adding new products
  productForm: FormGroup;
  customProductForm: FormGroup;

  // Available products from catalog
  availableProducts: ProductCatalog[] = [];
  filteredProducts: ProductCatalog[] = [];

  // Products added to the calculation
  calculationRows: MarginCalculationRow[] = [];

  // Margin options and current selection
  marginOptions = [10, 12, 15, 18, 20];
  currentMarginPercentage = 15;

  // Extended margin options for advanced view
  extendedMarginOptions: number[] = [];
  showExtendedView = false;
  customMarginInput = 15;

  // UI state
  isLoadingProducts = false;
  showProductForm = false;
  productSearchTerm = '';
  productMode: 'search' | 'custom' = 'search';
  productModeSelected = false; // New property to track if user has selected a mode
  showDropdown = false;
  selectedProduct: ProductCatalog | null = null;

  // Bundle calculation
  bundleTotal = 0;
  bundleMarginPrices: { [marginPercentage: number]: number } = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private productCatalogService: ProductCatalogService,
    private marginCalculatorService: MarginCalculatorService,
    private marginStateService: MarginStateService,
    private marginPanelService: MarginPanelService,
    private notificationService: NotificationService
  ) {
    this.productForm = this.fb.group({
      selectedProductId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      customCost: [null, [Validators.min(0)]]
    });

    this.customProductForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      cost: [null, [Validators.required, Validators.min(0.01)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.initializeExtendedMarginOptions();

    // Subscribe to margin state changes
    const marginSub = this.marginStateService.marginPercentage$.subscribe(margin => {
      this.currentMarginPercentage = margin;
      this.customMarginInput = margin;
      this.recalculateAllPrices();
    });
    this.subscriptions.push(marginSub);

    // Subscribe to panel visibility changes
    const panelSub = this.marginPanelService.panelVisibility$.subscribe(isVisible => {
      console.log('MarginCalculatorModalComponent: Received visibility change:', isVisible);
      this.isVisible = isVisible;
    });
    this.subscriptions.push(panelSub);
  }

  initializeExtendedMarginOptions(): void {
    // Generate extended margin options from 5% to 50% in 5% increments
    this.extendedMarginOptions = this.marginCalculatorService.generateMarginRange(5);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    const productSub = this.productCatalogService.getProducts().subscribe({
      next: (products) => {
        this.availableProducts = products.filter(p => p.isActive && p.cost && p.cost > 0);
        this.filteredProducts = [...this.availableProducts];
        this.isLoadingProducts = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load products');
        this.isLoadingProducts = false;
      }
    });
    this.subscriptions.push(productSub);
  }

  filterProducts(): void {
    if (!this.productSearchTerm.trim()) {
      this.filteredProducts = [...this.availableProducts];
      this.showDropdown = false;
      return;
    }

    const searchTerm = this.productSearchTerm.toLowerCase();
    this.filteredProducts = this.availableProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      (product.category && product.category.toLowerCase().includes(searchTerm))
    );
    this.showDropdown = true;
  }

  selectProduct(product: ProductCatalog): void {
    this.selectedProduct = product;
    this.productSearchTerm = product.name;
    this.showDropdown = false;

    // Set the selected product in the form
    this.productForm.patchValue({
      selectedProductId: product.id
    });
  }

  onSearchBlur(): void {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  addProduct(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const selectedProduct = this.availableProducts.find(p => p.id === formValue.selectedProductId);

      if (selectedProduct) {
        // Check if product already exists in calculation
        const existingIndex = this.calculationRows.findIndex(row => row.product.id === selectedProduct.id);

        if (existingIndex >= 0) {
          // Update existing product quantity
          this.calculationRows[existingIndex].quantity += formValue.quantity;
        } else {
          // Add new product
          const costPrice = formValue.customCost || selectedProduct.cost || 0;
          const newRow: MarginCalculationRow = {
            product: selectedProduct,
            quantity: formValue.quantity,
            costPrice: costPrice,
            sellingPrices: {},
            profits: {}
          };

          // Calculate prices for all margin options
          this.calculateRowPrices(newRow);
          this.calculationRows.push(newRow);
        }

        this.recalculateBundleTotal();
        this.productForm.reset();
        this.productForm.patchValue({ quantity: 1 });
        this.showProductForm = false;
        this.productModeSelected = false; // Reset selection state
        this.productSearchTerm = '';
        this.showDropdown = false;
        this.selectedProduct = null;
      }
    }
  }

  addCustomProduct(): void {
    if (this.customProductForm.valid) {
      const formValue = this.customProductForm.value;

      // Create a custom product object that matches ProductCatalog interface
      const customProduct: ProductCatalog = {
        id: `custom_${Date.now()}`, // Generate unique ID
        supplierId: 'custom', // Required field
        name: formValue.name,
        sku: `CUSTOM-${Date.now()}`,
        cost: formValue.cost,
        price: 0, // Will be calculated
        category: 'Custom',
        description: formValue.description || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create calculation row
      const newRow: MarginCalculationRow = {
        product: customProduct,
        quantity: formValue.quantity,
        costPrice: formValue.cost,
        sellingPrices: {},
        profits: {}
      };

      // Calculate prices for all margin options
      this.calculateRowPrices(newRow);
      this.calculationRows.push(newRow);

      this.recalculateBundleTotal();
      this.customProductForm.reset();
      this.customProductForm.patchValue({ quantity: 1 });
      this.showProductForm = false;
      this.productModeSelected = false; // Reset selection state

      this.notificationService.success(`Custom product "${formValue.name}" added successfully`);
    }
  }

  setProductMode(mode: 'search' | 'custom'): void {
    this.productMode = mode;
    // Reset forms when switching modes
    this.productForm.reset();
    this.productForm.patchValue({ quantity: 1 });
    this.customProductForm.reset();
    this.customProductForm.patchValue({ quantity: 1 });
    this.productSearchTerm = '';
    this.showDropdown = false;
    this.selectedProduct = null;
  }

  // New method to handle card selection
  selectProductMode(mode: 'search' | 'custom'): void {
    this.productMode = mode;
    this.productModeSelected = true;
    // Reset forms when selecting mode
    this.productForm.reset();
    this.productForm.patchValue({ quantity: 1 });
    this.customProductForm.reset();
    this.customProductForm.patchValue({ quantity: 1 });
    this.productSearchTerm = '';
    this.showDropdown = false;
    this.selectedProduct = null;
  }

  // New method to reset selection and go back to cards
  resetProductSelection(): void {
    this.productModeSelected = false;
    this.productMode = 'search'; // Reset to default
    // Reset forms
    this.productForm.reset();
    this.productForm.patchValue({ quantity: 1 });
    this.customProductForm.reset();
    this.customProductForm.patchValue({ quantity: 1 });
    this.productSearchTerm = '';
    this.showDropdown = false;
    this.selectedProduct = null;
  }

  // New method to handle cancel with proper reset
  cancelProductForm(): void {
    this.showProductForm = false;
    this.productModeSelected = false;
    this.productMode = 'search';
    // Reset forms
    this.productForm.reset();
    this.productForm.patchValue({ quantity: 1 });
    this.customProductForm.reset();
    this.customProductForm.patchValue({ quantity: 1 });
    this.productSearchTerm = '';
    this.showDropdown = false;
    this.selectedProduct = null;
  }

  removeProduct(index: number): void {
    this.calculationRows.splice(index, 1);
    this.recalculateBundleTotal();
  }

  updateQuantity(index: number, newQuantity: number): void {
    if (newQuantity > 0) {
      this.calculationRows[index].quantity = newQuantity;
      this.recalculateBundleTotal();
    }
  }

  calculateRowPrices(row: MarginCalculationRow): void {
    const activeMargins = this.getActiveMarginOptions();
    activeMargins.forEach(margin => {
      const sellingPrice = this.marginCalculatorService.calculateSellingPrice(row.costPrice, margin);
      row.sellingPrices[margin] = sellingPrice;
      row.profits[margin] = this.marginCalculatorService.calculateProfit(row.costPrice, sellingPrice);
    });
  }

  recalculateAllPrices(): void {
    this.calculationRows.forEach(row => this.calculateRowPrices(row));
    this.recalculateBundleTotal();
  }

  recalculateBundleTotal(): void {
    this.bundleTotal = this.calculationRows.reduce((total, row) => {
      return total + (row.costPrice * row.quantity);
    }, 0);

    // Calculate bundle prices for each active margin
    const activeMargins = this.getActiveMarginOptions();
    activeMargins.forEach(margin => {
      this.bundleMarginPrices[margin] = this.marginCalculatorService.calculateSellingPrice(this.bundleTotal, margin);
    });
  }

  selectMarginPercentage(margin: number): void {
    this.marginStateService.setMarginPercentage(margin);
  }

  toggleExtendedView(): void {
    this.showExtendedView = !this.showExtendedView;
  }

  onCustomMarginChange(margin: number): void {
    if (this.marginCalculatorService.isValidExtendedMarginPercentage(margin)) {
      this.marginStateService.setMarginPercentage(margin);
    }
  }

  getActiveMarginOptions(): number[] {
    return this.showExtendedView ? this.extendedMarginOptions : this.marginOptions;
  }

  isValidCustomMargin(): boolean {
    return this.marginCalculatorService.isValidExtendedMarginPercentage(this.customMarginInput);
  }

  getCustomMarginValidationMessage(): string {
    if (this.customMarginInput <= 0) {
      return 'Margin must be greater than 0%';
    }
    if (this.customMarginInput >= 100) {
      return 'Margin must be less than 100%';
    }
    return '';
  }

  isCurrentMargin(margin: number): boolean {
    return margin === this.currentMarginPercentage;
  }

  toggle(): void {
    console.log('MarginCalculatorModalComponent: Toggle clicked, current state:', this.isVisible);
    this.marginPanelService.togglePanel();
  }

  close(): void {
    console.log('MarginCalculatorModalComponent: Close clicked');
    this.marginPanelService.hidePanel();
    this.closeModal.emit();
  }

  // Method to reset panel state if it gets stuck
  resetPanelState(): void {
    console.log('Resetting panel state. Current debug info:', this.marginPanelService.getDebugInfo());
    this.marginPanelService.clearStoredState();
    this.notificationService.info('Panel state has been reset');
  }

  // Helper method to get current panel state for debugging
  getCurrentPanelState(): boolean {
    return this.marginPanelService.isPanelVisible();
  }

  // Debug method to log current state
  logDebugInfo(): void {
    console.log('Panel Debug Info:', this.marginPanelService.getDebugInfo());
    console.log('Component isVisible:', this.isVisible);
  }

  clearAll(): void {
    this.calculationRows = [];
    this.bundleTotal = 0;
    this.bundleMarginPrices = {};
  }
}
