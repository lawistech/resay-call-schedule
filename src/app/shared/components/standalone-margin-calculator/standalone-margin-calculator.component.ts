// src/app/shared/components/standalone-margin-calculator/standalone-margin-calculator.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MarginCalculatorService } from '../../../features/quotations/services/margin-calculator.service';
import { MarginStateService } from '../../../core/services/margin-state.service';
import { ProductCatalogService } from '../../../features/ecommerce/services/product-catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductCatalog } from '../../../features/ecommerce/models/product-catalog.model';
import { Subscription } from 'rxjs';

export interface StandaloneCalculationResult {
  cost: number;
  marginPercentage: number;
  sellingPrice: number;
  profit: number;
  profitMargin: number;
}

export interface CustomProduct {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  description?: string;
}

export interface ProductCalculationRow {
  product: CustomProduct;
  quantity: number;
  costPrice: number;
  sellingPrices: { [marginPercentage: number]: number };
  profits: { [marginPercentage: number]: number };
}

@Component({
  selector: 'app-standalone-margin-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './standalone-margin-calculator.component.html',
  styleUrls: ['./standalone-margin-calculator.component.scss']
})
export class StandaloneMarginCalculatorComponent implements OnInit, OnDestroy {
  // Panel visibility control
  @Input() isVisible = false;
  @Output() closePanel = new EventEmitter<void>();

  // Input values
  costPrice = 0;
  customMarginInput = 15;
  quantity = 1;

  // Predefined margin options
  marginOptions = [10, 12, 15, 18, 20];
  extendedMarginOptions: number[] = [];

  // Current state
  currentMarginPercentage = 15;
  showExtendedView = false;
  showVariations = true;

  // Calculation results
  calculationResults: StandaloneCalculationResult[] = [];
  singleResult: StandaloneCalculationResult | null = null;

  // UI state
  calculationMode: 'single' | 'comparison' | 'products' = 'comparison';

  // Product form and management
  productForm: FormGroup;
  showProductForm = false;
  productCalculationRows: ProductCalculationRow[] = [];
  productCounter = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private marginCalculatorService: MarginCalculatorService,
    private marginStateService: MarginStateService,
    private productCatalogService: ProductCatalogService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      cost: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.initializeExtendedMarginOptions();

    // Subscribe to margin state changes
    const marginSub = this.marginStateService.marginPercentage$.subscribe(margin => {
      this.currentMarginPercentage = margin;
      this.customMarginInput = margin;
      this.calculateResults();
    });
    this.subscriptions.push(marginSub);

    // Initial calculation
    this.calculateResults();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initializeExtendedMarginOptions(): void {
    // Generate extended margin options from 5% to 50% in 5% increments
    this.extendedMarginOptions = this.marginCalculatorService.generateMarginRange(5);
  }

  getActiveMarginOptions(): number[] {
    return this.showExtendedView ? this.extendedMarginOptions : this.marginOptions;
  }

  toggleExtendedView(): void {
    this.showExtendedView = !this.showExtendedView;
    this.calculateResults();
  }

  toggleVariations(): void {
    this.showVariations = !this.showVariations;
  }

  toggleCalculationMode(): void {
    if (this.calculationMode === 'single') {
      this.calculationMode = 'comparison';
    } else if (this.calculationMode === 'comparison') {
      this.calculationMode = 'products';
    } else {
      this.calculationMode = 'single';
    }
    this.calculateResults();
  }

  onMarginChange(margin: number): void {
    this.currentMarginPercentage = margin;
    this.customMarginInput = margin;
    this.marginStateService.setMarginPercentage(margin);
    this.calculateResults();
  }

  onCustomMarginChange(): void {
    if (this.isValidCustomMargin()) {
      this.onMarginChange(this.customMarginInput);
    }
  }

  onCostPriceChange(): void {
    this.calculateResults();
  }

  onQuantityChange(): void {
    this.calculateResults();
  }

  calculateResults(): void {
    if (this.calculationMode === 'products') {
      this.calculateProductResults();
      return;
    }

    if (this.costPrice <= 0) {
      this.calculationResults = [];
      this.singleResult = null;
      return;
    }

    if (this.calculationMode === 'single') {
      this.calculateSingleResult();
    } else {
      this.calculateComparisonResults();
    }
  }

  calculateSingleResult(): void {
    const sellingPrice = this.marginCalculatorService.calculateSellingPrice(this.costPrice, this.currentMarginPercentage);
    const profit = this.marginCalculatorService.calculateProfit(this.costPrice, sellingPrice);
    const profitMargin = this.marginCalculatorService.calculateMarginPercentage(this.costPrice, sellingPrice);

    this.singleResult = {
      cost: this.costPrice,
      marginPercentage: this.currentMarginPercentage,
      sellingPrice: sellingPrice,
      profit: profit,
      profitMargin: profitMargin
    };
  }

  calculateComparisonResults(): void {
    const activeMargins = this.getActiveMarginOptions();
    this.calculationResults = activeMargins.map(margin => {
      const sellingPrice = this.marginCalculatorService.calculateSellingPrice(this.costPrice, margin);
      const profit = this.marginCalculatorService.calculateProfit(this.costPrice, sellingPrice);
      const profitMargin = this.marginCalculatorService.calculateMarginPercentage(this.costPrice, sellingPrice);

      return {
        cost: this.costPrice,
        marginPercentage: margin,
        sellingPrice: sellingPrice,
        profit: profit,
        profitMargin: profitMargin
      };
    });
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

  getMarginColorClass(margin: number): string {
    const colorMap: { [key: number]: string } = {
      10: 'bg-orange-50 border-orange-200 text-orange-800',
      12: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      15: 'bg-green-50 border-green-200 text-green-800',
      18: 'bg-blue-50 border-blue-200 text-blue-800',
      20: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colorMap[margin] || 'bg-gray-50 border-gray-200 text-gray-800';
  }

  getTotalSellingPrice(result: StandaloneCalculationResult): number {
    return result.sellingPrice * this.quantity;
  }

  getTotalProfit(result: StandaloneCalculationResult): number {
    return result.profit * this.quantity;
  }

  getTotalCost(): number {
    return this.costPrice * this.quantity;
  }

  clearInputs(): void {
    this.costPrice = 0;
    this.quantity = 1;
    this.customMarginInput = 15;
    this.currentMarginPercentage = 15;
    this.calculationResults = [];
    this.singleResult = null;
    this.productCalculationRows = [];
    this.productForm.reset({
      cost: 0,
      quantity: 1
    });
    this.showProductForm = false;
  }

  exportResults(): void {
    // Future enhancement: Export calculation results to CSV or PDF
    console.log('Export functionality to be implemented');
  }

  // Product management methods
  toggleProductForm(): void {
    this.showProductForm = !this.showProductForm;
    if (!this.showProductForm) {
      this.productForm.reset({
        cost: 0,
        quantity: 1
      });
    }
  }

  addProduct(): void {
    if (this.productForm.invalid) {
      this.notificationService.error('Please fill in all required fields correctly');
      return;
    }

    const formValue = this.productForm.value;
    const customProduct: CustomProduct = {
      id: `custom-${this.productCounter++}`,
      name: formValue.name,
      cost: formValue.cost,
      quantity: formValue.quantity,
      description: formValue.description || ''
    };

    const productRow = this.createProductCalculationRow(customProduct);
    this.productCalculationRows.push(productRow);

    // Reset form
    this.productForm.reset({
      cost: 0,
      quantity: 1
    });
    this.showProductForm = false;

    this.notificationService.success(`Product "${customProduct.name}" added successfully`);
    this.calculateProductResults();
  }

  createProductCalculationRow(product: CustomProduct): ProductCalculationRow {
    const sellingPrices: { [marginPercentage: number]: number } = {};
    const profits: { [marginPercentage: number]: number } = {};

    this.getActiveMarginOptions().forEach(margin => {
      const sellingPrice = this.marginCalculatorService.calculateSellingPrice(product.cost, margin);
      const profit = this.marginCalculatorService.calculateProfit(product.cost, sellingPrice);

      sellingPrices[margin] = sellingPrice;
      profits[margin] = profit;
    });

    return {
      product: product,
      quantity: product.quantity,
      costPrice: product.cost,
      sellingPrices: sellingPrices,
      profits: profits
    };
  }

  calculateProductResults(): void {
    // Recalculate all product rows with current margin options
    this.productCalculationRows = this.productCalculationRows.map(row =>
      this.createProductCalculationRow(row.product)
    );
  }

  removeProduct(index: number): void {
    if (index >= 0 && index < this.productCalculationRows.length) {
      const productName = this.productCalculationRows[index].product.name;
      this.productCalculationRows.splice(index, 1);
      this.notificationService.success(`Product "${productName}" removed`);
      this.calculateProductResults();
    }
  }

  updateProductQuantity(index: number, newQuantity: number): void {
    if (index >= 0 && index < this.productCalculationRows.length && newQuantity > 0) {
      this.productCalculationRows[index].product.quantity = newQuantity;
      this.productCalculationRows[index].quantity = newQuantity;
      this.calculateProductResults();
    }
  }

  getProductTotalCost(): number {
    return this.productCalculationRows.reduce((total, row) =>
      total + (row.costPrice * row.quantity), 0
    );
  }

  getProductTotalSellingPrice(margin: number): number {
    return this.productCalculationRows.reduce((total, row) =>
      total + (row.sellingPrices[margin] * row.quantity), 0
    );
  }

  getProductTotalProfit(margin: number): number {
    return this.productCalculationRows.reduce((total, row) =>
      total + (row.profits[margin] * row.quantity), 0
    );
  }

  // Panel control methods
  close(): void {
    this.closePanel.emit();
  }

  // ESC key handler
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(_event: KeyboardEvent): void {
    if (this.isVisible) {
      this.close();
    }
  }

  // Background overlay click handler
  onOverlayClick(): void {
    this.close();
  }

  // Prevent panel content clicks from closing the panel
  onPanelClick(event: Event): void {
    event.stopPropagation();
  }
}
