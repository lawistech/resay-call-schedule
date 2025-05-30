// src/app/core/services/margin-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarginStateService {
  private readonly STORAGE_KEY = 'selectedMarginPercentage';
  private readonly DEFAULT_MARGIN = 15; // Default to 15%

  // BehaviorSubject to track the current margin percentage
  private marginPercentageSubject = new BehaviorSubject<number>(this.getStoredMarginPercentage());

  constructor() {
    // Initialize with stored value or default
    const storedMargin = this.getStoredMarginPercentage();
    this.marginPercentageSubject.next(storedMargin);
  }

  /**
   * Observable for components to subscribe to margin percentage changes
   */
  get marginPercentage$(): Observable<number> {
    return this.marginPercentageSubject.asObservable();
  }

  /**
   * Get the current margin percentage value
   */
  getCurrentMarginPercentage(): number {
    return this.marginPercentageSubject.value;
  }

  /**
   * Set a new margin percentage and persist it
   */
  setMarginPercentage(marginPercentage: number): void {
    // Use extended validation for more flexibility
    if (this.isValidExtendedMarginPercentage(marginPercentage)) {
      this.marginPercentageSubject.next(marginPercentage);
      this.storeMarginPercentage(marginPercentage);
    } else {
      console.warn(`Invalid margin percentage: ${marginPercentage}. Using default: ${this.DEFAULT_MARGIN}%`);
      this.setMarginPercentage(this.DEFAULT_MARGIN);
    }
  }

  /**
   * Reset margin percentage to default
   */
  resetToDefault(): void {
    this.setMarginPercentage(this.DEFAULT_MARGIN);
  }

  /**
   * Get stored margin percentage from localStorage
   */
  private getStoredMarginPercentage(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        return this.isValidExtendedMarginPercentage(parsed) ? parsed : this.DEFAULT_MARGIN;
      }
    } catch (error) {
      console.error('Error reading stored margin percentage:', error);
    }
    return this.DEFAULT_MARGIN;
  }

  /**
   * Store margin percentage to localStorage
   */
  private storeMarginPercentage(marginPercentage: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, marginPercentage.toString());
    } catch (error) {
      console.error('Error storing margin percentage:', error);
    }
  }

  /**
   * Validate if a margin percentage is within acceptable range
   */
  private isValidMarginPercentage(marginPercentage: number): boolean {
    return !isNaN(marginPercentage) && marginPercentage >= 5 && marginPercentage <= 50;
  }

  /**
   * Validate if a margin percentage is within extended range (for advanced calculations)
   */
  private isValidExtendedMarginPercentage(marginPercentage: number): boolean {
    return !isNaN(marginPercentage) && marginPercentage > 0 && marginPercentage < 100;
  }

  /**
   * Get predefined margin options
   */
  getMarginOptions(): number[] {
    return [10, 12, 15, 18, 20];
  }

  /**
   * Check if the current margin is one of the predefined options
   */
  isCurrentMarginPredefined(): boolean {
    const current = this.getCurrentMarginPercentage();
    return this.getMarginOptions().includes(current);
  }

  /**
   * Get the closest predefined margin option to the current margin
   */
  getClosestPredefinedMargin(): number {
    const current = this.getCurrentMarginPercentage();
    const options = this.getMarginOptions();

    return options.reduce((closest, option) => {
      return Math.abs(option - current) < Math.abs(closest - current)
        ? option
        : closest;
    });
  }
}
