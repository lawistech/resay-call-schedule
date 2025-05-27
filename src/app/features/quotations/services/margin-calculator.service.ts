// src/app/features/quotations/services/margin-calculator.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MarginCalculatorService {

  // Predefined margin percentage options
  readonly MARGIN_OPTIONS = [10, 12, 15, 18, 20];

  constructor() { }

  /**
   * Calculate selling price based on cost and desired margin percentage
   * Formula: Selling Price = Cost / (1 - Margin%)
   * This is the correct margin calculation (not markup)
   * 
   * @param cost - The cost price of the product
   * @param marginPercentage - The desired margin percentage (e.g., 15 for 15%)
   * @returns The calculated selling price
   */
  calculateSellingPrice(cost: number, marginPercentage: number): number {
    if (cost <= 0) {
      return 0;
    }
    
    if (marginPercentage <= 0 || marginPercentage >= 100) {
      return cost; // Return cost if margin is invalid
    }

    const marginDecimal = marginPercentage / 100;
    const sellingPrice = cost / (1 - marginDecimal);
    
    // Round to 2 decimal places
    return Math.round(sellingPrice * 100) / 100;
  }

  /**
   * Calculate margin percentage from cost and selling price
   * Formula: Margin% = (Selling Price - Cost) / Selling Price * 100
   * 
   * @param cost - The cost price of the product
   * @param sellingPrice - The selling price of the product
   * @returns The calculated margin percentage
   */
  calculateMarginPercentage(cost: number, sellingPrice: number): number {
    if (sellingPrice <= 0 || cost <= 0) {
      return 0;
    }

    const marginPercentage = ((sellingPrice - cost) / sellingPrice) * 100;
    
    // Round to 2 decimal places
    return Math.round(marginPercentage * 100) / 100;
  }

  /**
   * Calculate profit amount from cost and selling price
   * 
   * @param cost - The cost price of the product
   * @param sellingPrice - The selling price of the product
   * @returns The profit amount
   */
  calculateProfit(cost: number, sellingPrice: number): number {
    return Math.max(0, sellingPrice - cost);
  }

  /**
   * Validate if a margin percentage is within acceptable range
   * 
   * @param marginPercentage - The margin percentage to validate
   * @returns True if valid, false otherwise
   */
  isValidMarginPercentage(marginPercentage: number): boolean {
    return marginPercentage > 0 && marginPercentage < 100;
  }

  /**
   * Get the closest predefined margin option to a given percentage
   * 
   * @param marginPercentage - The target margin percentage
   * @returns The closest predefined margin option
   */
  getClosestMarginOption(marginPercentage: number): number {
    if (!this.isValidMarginPercentage(marginPercentage)) {
      return this.MARGIN_OPTIONS[2]; // Default to 15%
    }

    return this.MARGIN_OPTIONS.reduce((closest, option) => {
      return Math.abs(option - marginPercentage) < Math.abs(closest - marginPercentage) 
        ? option 
        : closest;
    });
  }

  /**
   * Apply margin to multiple products
   * 
   * @param products - Array of products with cost information
   * @param marginPercentage - The margin percentage to apply
   * @returns Array of products with calculated selling prices
   */
  applyMarginToProducts(products: any[], marginPercentage: number): any[] {
    return products.map(product => ({
      ...product,
      calculatedPrice: this.calculateSellingPrice(product.cost || 0, marginPercentage),
      marginPercentage: marginPercentage,
      profit: this.calculateProfit(product.cost || 0, this.calculateSellingPrice(product.cost || 0, marginPercentage))
    }));
  }
}
