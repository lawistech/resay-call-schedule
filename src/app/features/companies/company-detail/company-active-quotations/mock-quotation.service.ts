// src/app/features/companies/company-detail/company-active-quotations/mock-quotation.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Quotation } from '../../../../core/models/quotation.model';

@Injectable({
  providedIn: 'root'
})
export class MockQuotationService {
  
  constructor() {}

  getQuotationsByCompany(companyId: string): Observable<Quotation[]> {
    console.log('MockQuotationService: Providing mock data for company:', companyId);
    
    // Generate some mock quotations for testing
    const mockQuotations: Quotation[] = [
      {
        id: '1',
        companyId: companyId,
        title: 'Software License Quotation',
        status: 'draft',
        total: 1250.00,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        companyId: companyId,
        title: 'Hardware Upgrade Quotation',
        status: 'sent',
        total: 3750.50,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        id: '3',
        companyId: companyId,
        title: 'Consulting Services Quotation',
        status: 'accepted',
        total: 5000.00,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
      }
    ];
    
    return of(mockQuotations);
  }
}
