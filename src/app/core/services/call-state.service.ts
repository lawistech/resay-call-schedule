import { Injectable } from '@angular/core';
import { Call } from '../models/call.model';

@Injectable({
  providedIn: 'root'
})
export class CallStateService {
  private activeCall: Call | null = null;
  private showPostCallModal = false;

  constructor() {
    // Try to restore state from localStorage on service init
    try {
      const savedCall = localStorage.getItem('activeCall');
      if (savedCall) {
        this.activeCall = JSON.parse(savedCall);
        this.showPostCallModal = true;
      }
    } catch (e) {
      console.error('Error restoring call state:', e);
      this.clearActiveCall();
    }
  }

  setActiveCall(call: Call): void {
    this.activeCall = call;
    this.showPostCallModal = true;
    // Save to localStorage for persistence across navigation
    localStorage.setItem('activeCall', JSON.stringify(call));
  }

  getActiveCall(): Call | null {
    return this.activeCall;
  }

  shouldShowPostCallModal(): boolean {
    return this.showPostCallModal;
  }

  clearActiveCall(): void {
    this.activeCall = null;
    this.showPostCallModal = false;
    localStorage.removeItem('activeCall');
  }
}