import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Opportunity } from '../../core/models/company.model';

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService {
  // Mock data for testing
  private mockOpportunities: Opportunity[] = [
    {
      id: 'opp1',
      title: 'Enterprise Software License',
      description: 'Annual license renewal for CRM software',
      status: 'In Progress',
      probability: 75,
      expectedCloseDate: new Date(2025, 5, 15),
      amount: 125000,
      companyId: 'comp1',
      stage: 'Negotiation',
      value: 125000,
      closeDate: new Date(2025, 5, 15),
      notes: 'Client is considering upgrading to premium tier',
      createdAt: new Date(2025, 1, 10),
      updatedAt: new Date(2025, 3, 20)
    },
    {
      id: 'opp2',
      title: 'Cloud Migration Services',
      description: 'Migrating on-premise infrastructure to cloud',
      status: 'New',
      probability: 50,
      expectedCloseDate: new Date(2025, 7, 30),
      amount: 85000,
      companyId: 'comp2',
      stage: 'Discovery',
      value: 85000,
      closeDate: new Date(2025, 7, 30),
      notes: 'Need to schedule technical assessment',
      createdAt: new Date(2025, 3, 5),
      updatedAt: new Date(2025, 3, 5)
    },
    {
      id: 'opp3',
      title: 'Hardware Upgrade',
      description: 'Workstation replacement for marketing department',
      status: 'Won',
      probability: 100,
      expectedCloseDate: new Date(2025, 2, 10),
      amount: 45000,
      companyId: 'comp3',
      stage: 'Closed-Won',
      value: 45000,
      closeDate: new Date(2025, 2, 10),
      notes: 'Delivery scheduled for next month',
      createdAt: new Date(2025, 0, 15),
      updatedAt: new Date(2025, 2, 10)
    },
    {
      id: 'opp4',
      title: 'Consulting Services',
      description: 'Business process optimization',
      status: 'In Progress',
      probability: 60,
      expectedCloseDate: new Date(2025, 6, 20),
      amount: 35000,
      companyId: 'comp4',
      stage: 'Proposal',
      value: 35000,
      closeDate: new Date(2025, 6, 20),
      notes: 'Proposal presentation scheduled next week',
      createdAt: new Date(2025, 2, 25),
      updatedAt: new Date(2025, 3, 15)
    },
    {
      id: 'opp5',
      title: 'Training Program',
      description: 'Employee onboarding and skills development',
      status: 'Lost',
      probability: 0,
      expectedCloseDate: new Date(2025, 1, 28),
      amount: 22000,
      companyId: 'comp5',
      stage: 'Prospecting',
      value: 22000,
      closeDate: new Date(2025, 1, 28),
      notes: 'Client went with competitor offering',
      createdAt: new Date(2024, 11, 10),
      updatedAt: new Date(2025, 1, 28)
    }
  ];

  constructor() {}

  getOpportunities(): Observable<Opportunity[]> {
    // Return mock data
    return of(this.mockOpportunities);
  }

  addOpportunity(payload: Partial<Opportunity>): Observable<Opportunity> {
    const newOpportunity: Opportunity = {
      id: 'opp_' + Math.random().toString(36).substr(2, 9),
      title: payload.title || '',
      description: payload.description,
      status: payload.status as 'New' | 'In Progress' | 'Won' | 'Lost' || 'New',
      probability: payload.probability || 0,
      expectedCloseDate: payload.expectedCloseDate || new Date(),
      amount: payload.amount || 0,
      companyId: payload.companyId || '',
      stage: payload.stage || 'Prospecting',
      value: payload.amount || 0,
      closeDate: payload.expectedCloseDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to mock data
    this.mockOpportunities.unshift(newOpportunity);
    
    return of(newOpportunity);
  }

  updateOpportunity(id: string, payload: Partial<Opportunity>): Observable<Opportunity> {
    // Find the opportunity to update
    const index = this.mockOpportunities.findIndex(o => o.id === id);
    
    if (index !== -1) {
      // Create updated opportunity
      const updatedOpportunity: Opportunity = {
        ...this.mockOpportunities[index],
        ...payload,
        updatedAt: new Date()
      };
      
      // Update the mock data
      this.mockOpportunities[index] = updatedOpportunity;
      
      return of(updatedOpportunity);
    }
    
    // Return the existing opportunity if not found (shouldn't happen in normal flow)
    return of(this.mockOpportunities.find(o => o.id === id) as Opportunity);
  }
}