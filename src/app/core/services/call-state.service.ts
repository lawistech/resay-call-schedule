import { Injectable } from '@angular/core';
import { Call } from '../models/call.model';

@Injectable({
  providedIn: 'root'
})
export class CallStateService {
  private activeCall: Call | null = null;
  private showPostCallModal = false;
  private navigateToCompanyDetails = false;

  constructor() {
    // Try to restore state from localStorage on service init
    try {
      const savedCall = localStorage.getItem('activeCall');
      if (savedCall) {
        this.activeCall = JSON.parse(savedCall);
        this.showPostCallModal = true;
      }

      const navigateToCompany = localStorage.getItem('navigateToCompanyDetails');
      if (navigateToCompany) {
        this.navigateToCompanyDetails = JSON.parse(navigateToCompany);
      }
    } catch (e) {
      console.error('Error restoring call state:', e);
      this.clearActiveCall();
    }
  }

  setActiveCall(call: Call, navigateToCompany: boolean = false): void {
    this.activeCall = call;
    this.showPostCallModal = true;
    this.navigateToCompanyDetails = navigateToCompany;

    // Save to localStorage for persistence across navigation
    localStorage.setItem('activeCall', JSON.stringify(call));
    localStorage.setItem('navigateToCompanyDetails', JSON.stringify(navigateToCompany));
  }

  getActiveCall(): Call | null {
    return this.activeCall;
  }

  shouldShowPostCallModal(): boolean {
    return this.showPostCallModal;
  }

  shouldNavigateToCompanyDetails(): boolean {
    return this.navigateToCompanyDetails;
  }

  clearActiveCall(): void {
    this.activeCall = null;
    this.showPostCallModal = false;
    this.navigateToCompanyDetails = false;
    localStorage.removeItem('activeCall');
    localStorage.removeItem('navigateToCompanyDetails');
  }
}