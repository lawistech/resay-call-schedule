import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Opportunity } from '../../core/models/company.model';

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

  addOpportunity(payload: Partial<Opportunity>): Observable<Opportunity> {
    // Format dates properly for API
    const formattedPayload = this.formatDatesForApi(payload);
    
    return this.http.post<Opportunity>(this.baseUrl, formattedPayload).pipe(
      catchError(this.handleError)
    );
  }

  updateOpportunity(id: string, payload: Partial<Opportunity>): Observable<Opportunity> {
    // Format dates properly for API
    const formattedPayload = this.formatDatesForApi(payload);
    
    return this.http.put<Opportunity>(`${this.baseUrl}/${id}`, formattedPayload).pipe(
      catchError(this.handleError)
    );
  }

  private formatDatesForApi(payload: Partial<Opportunity>): any {
    // Make a copy so we don't modify the original
    const formatted: any = { ...payload };
    
    // Convert Date objects to ISO strings for the API
    if (formatted.expectedCloseDate) {
      try {
        // Handle both Date objects and string dates
        const date = formatted.expectedCloseDate instanceof Date 
          ? formatted.expectedCloseDate 
          : new Date(formatted.expectedCloseDate);
          
        // Check if the date is valid before converting
        if (!isNaN(date.getTime())) {
          formatted.expectedCloseDate = date.toISOString();
        }
      } catch (error) {
        console.warn('Invalid expectedCloseDate format:', formatted.expectedCloseDate);
        // Keep the original value if conversion fails
      }
    }
    
    if (formatted.closeDate) {
      try {
        // Handle both Date objects and string dates
        const date = formatted.closeDate instanceof Date 
          ? formatted.closeDate 
          : new Date(formatted.closeDate);
          
        // Check if the date is valid before converting
        if (!isNaN(date.getTime())) {
          formatted.closeDate = date.toISOString();
        }
      } catch (error) {
        console.warn('Invalid closeDate format:', formatted.closeDate);
        // Keep the original value if conversion fails
      }
    }
    
    return formatted;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('OpportunitiesService error:', error);
    let errorMsg = 'An error occurred while processing opportunities';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMsg = `Error: ${error.error.message}`;
    } else if (error.status) {
      // Server-side error
      errorMsg = `Error Code: ${error.status}, Message: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMsg));
  }
}