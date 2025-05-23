import { Injectable } from '@angular/core';
import { Company } from '../models/company.model';
import { Contact } from '../models/contact.model';

export interface LeadWizardState {
  currentStep: number;
  companySearchTerm: string;
  selectedCompany: Company | null;
  showNewCompanyForm: boolean;
  companyFormData: any;
  contactFormData: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeadWizardStateService {
  private readonly STORAGE_KEY = 'leadWizardState';
  private readonly STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

  constructor() {}

  saveState(state: LeadWizardState): void {
    try {
      const stateWithTimestamp = {
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Error saving lead wizard state:', error);
    }
  }

  getState(): LeadWizardState | null {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (!savedState) {
        return null;
      }

      const state: LeadWizardState = JSON.parse(savedState);
      
      // Check if state has expired
      const now = Date.now();
      const stateAge = now - state.timestamp;
      const maxAge = this.STATE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

      if (stateAge > maxAge) {
        this.clearState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Error retrieving lead wizard state:', error);
      this.clearState();
      return null;
    }
  }

  clearState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing lead wizard state:', error);
    }
  }

  hasState(): boolean {
    return this.getState() !== null;
  }
}
