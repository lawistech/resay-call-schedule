import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

import { Opportunity } from '../../core/models/company.model';
export type { Opportunity };

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService {
  private readonly baseUrl = '/api/opportunities';

  constructor(private http: HttpClient) {}

  getOpportunities(): Observable<Opportunity[]> {
    return this.http.get<Opportunity[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  addOpportunity(payload: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>): Observable<Opportunity> {
    const newOpportunity = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return this.http.post<Opportunity>(this.baseUrl, newOpportunity).pipe(
      catchError(this.handleError)
    );
  }

  updateOpportunity(id: string, payload: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>): Observable<Opportunity> {
    const updatePayload = {
      ...payload,
      updatedAt: new Date()
    };
    
    return this.http.put<Opportunity>(`${this.baseUrl}/${id}`, updatePayload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('OpportunitiesService error:', error);
    return throwError(() => new Error('An error occurred while processing opportunities'));
  }
}
