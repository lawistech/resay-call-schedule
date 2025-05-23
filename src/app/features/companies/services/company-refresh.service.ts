// src/app/features/companies/services/company-refresh.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyRefreshService {
  // Subject to notify when a call is scheduled
  private callScheduledSource = new Subject<string>();

  // Subject to notify when a communication is added
  private communicationAddedSource = new Subject<string>();

  // Observable that components can subscribe to
  callScheduled$ = this.callScheduledSource.asObservable();
  communicationAdded$ = this.communicationAddedSource.asObservable();

  constructor() {}

  // Method to notify that a call has been scheduled for a company
  notifyCallScheduled(companyId: string): void {
    this.callScheduledSource.next(companyId);
  }

  // Method to notify that a communication has been added for a company
  notifyCommunicationAdded(companyId: string): void {
    this.communicationAddedSource.next(companyId);
  }
}
