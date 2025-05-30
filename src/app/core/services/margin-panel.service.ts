// src/app/core/services/margin-panel.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarginPanelService {
  private readonly STORAGE_KEY = 'marginPanelState';

  // BehaviorSubject to track the panel visibility state
  private panelVisibilitySubject = new BehaviorSubject<boolean>(false);

  constructor() {
    // Always initialize as closed for security and better UX
    // Panel state should only be restored when explicitly requested
    console.log('MarginPanelService: Initializing with closed state');
    this.panelVisibilitySubject.next(false);
  }

  /**
   * Observable for components to subscribe to panel visibility changes
   */
  get panelVisibility$(): Observable<boolean> {
    return this.panelVisibilitySubject.asObservable();
  }

  /**
   * Get the current panel visibility state
   */
  isPanelVisible(): boolean {
    return this.panelVisibilitySubject.value;
  }

  /**
   * Show the margin calculator panel
   */
  showPanel(): void {
    this.setPanelVisibility(true);
  }

  /**
   * Hide the margin calculator panel
   */
  hidePanel(): void {
    this.setPanelVisibility(false);
  }

  /**
   * Toggle the margin calculator panel visibility
   */
  togglePanel(): void {
    const currentState = this.isPanelVisible();
    this.setPanelVisibility(!currentState);
  }

  /**
   * Set panel visibility state without persisting it
   * This prevents unwanted persistence that causes the panel to reopen on login
   */
  private setPanelVisibility(isVisible: boolean): void {
    console.log('MarginPanelService: Setting panel visibility to:', isVisible);
    this.panelVisibilitySubject.next(isVisible);
    // Removed automatic persistence to prevent issues on login
    // this.storePanelState(isVisible);
  }

  /**
   * Get stored panel state from localStorage
   */
  private getStoredPanelState(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading stored panel state:', error);
    }
    return false; // Default to closed
  }

  /**
   * Store panel state to localStorage
   */
  private storePanelState(isVisible: boolean): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(isVisible));
    } catch (error) {
      console.error('Error storing panel state:', error);
    }
  }

  /**
   * Reset panel state to default (closed)
   */
  resetToDefault(): void {
    this.setPanelVisibility(false);
  }

  /**
   * Force refresh the panel state from localStorage
   */
  refreshFromStorage(): void {
    const storedState = this.getStoredPanelState();
    this.panelVisibilitySubject.next(storedState);
  }

  /**
   * Clear stored state and reset to default
   */
  clearStoredState(): void {
    try {
      console.log('MarginPanelService: Clearing stored state and forcing panel closed');
      localStorage.removeItem(this.STORAGE_KEY);
      // Force the panel to close immediately
      this.panelVisibilitySubject.next(false);
    } catch (error) {
      console.error('Error clearing stored panel state:', error);
    }
  }

  /**
   * Manually save current state to localStorage (if needed)
   */
  saveCurrentState(): void {
    this.storePanelState(this.isPanelVisible());
  }

  /**
   * Debug method to get current state info
   */
  getDebugInfo(): { current: boolean; stored: string | null } {
    return {
      current: this.isPanelVisible(),
      stored: localStorage.getItem(this.STORAGE_KEY)
    };
  }
}
