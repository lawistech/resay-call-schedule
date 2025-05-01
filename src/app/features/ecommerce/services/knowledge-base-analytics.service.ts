// src/app/features/ecommerce/services/knowledge-base-analytics.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  KnowledgeBaseAnalytics, 
  KnowledgeBaseFeedback, 
  KnowledgeBaseRating 
} from '../models/product-knowledge-base.model';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseAnalyticsService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  /**
   * Track a knowledge base action (view, search, download)
   */
  trackAction(
    knowledgeBaseId: string, 
    action: 'view' | 'search' | 'download', 
    searchTerm?: string
  ): Observable<void> {
    const currentUser = this.authService.getCurrentUser();
    const sessionId = this.getSessionId();
    
    const analyticsEntry = {
      knowledge_base_id: knowledgeBaseId,
      user_id: currentUser?.id,
      action,
      search_term: searchTerm,
      session_id: sessionId,
      ip_address: '', // We don't collect this for privacy reasons
      user_agent: navigator.userAgent
    };
    
    return from(this.supabaseService.supabaseClient
      .from('product_kb_analytics')
      .insert(analyticsEntry)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
      }),
      catchError(error => {
        console.error('Failed to track analytics:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get popular knowledge base entries
   */
  getPopularEntries(): Observable<any[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_popular')
      .select(`
        *,
        knowledge_base:knowledge_base_id(
          id,
          product_id,
          title,
          category
        )
      `)
      .order('total_score', { ascending: false })
      .limit(10)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch popular entries: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Submit feedback for a knowledge base entry
   */
  submitFeedback(
    knowledgeBaseId: string, 
    feedback: { 
      rating?: number; 
      feedbackText?: string; 
      isHelpful?: boolean; 
    }
  ): Observable<void> {
    const currentUser = this.authService.getCurrentUser();
    
    const feedbackEntry = {
      knowledge_base_id: knowledgeBaseId,
      user_id: currentUser?.id,
      rating: feedback.rating,
      feedback_text: feedback.feedbackText,
      is_helpful: feedback.isHelpful,
      status: 'pending'
    };
    
    return from(this.supabaseService.supabaseClient
      .from('product_kb_feedback')
      .insert(feedbackEntry)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Thank you for your feedback!');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to submit feedback: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get feedback for a knowledge base entry
   */
  getFeedback(knowledgeBaseId: string): Observable<KnowledgeBaseFeedback[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_feedback')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(feedback => this.mapDbFeedbackToModel(feedback));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch feedback: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all pending feedback (for admins)
   */
  getPendingFeedback(): Observable<KnowledgeBaseFeedback[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_feedback')
      .select(`
        *,
        knowledge_base:knowledge_base_id(
          id,
          title,
          category
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(feedback => this.mapDbFeedbackToModel(feedback));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch pending feedback: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update feedback status (for admins)
   */
  updateFeedbackStatus(
    feedbackId: string, 
    status: 'reviewed' | 'implemented' | 'rejected', 
    adminResponse?: string
  ): Observable<void> {
    const currentUser = this.authService.getCurrentUser();
    
    const updateData = {
      status,
      admin_response: adminResponse,
      reviewed_by: currentUser?.id,
      reviewed_at: new Date().toISOString()
    };
    
    return from(this.supabaseService.supabaseClient
      .from('product_kb_feedback')
      .update(updateData)
      .eq('id', feedbackId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Feedback updated successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update feedback: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get ratings for a knowledge base entry
   */
  getRatings(knowledgeBaseId: string): Observable<KnowledgeBaseRating> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_ratings')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .single()
    ).pipe(
      map(response => {
        if (response.error) {
          // If no ratings exist yet, return default values
          if (response.error.code === 'PGRST116') {
            return {
              knowledgeBaseId,
              totalRatings: 0,
              averageRating: 0,
              helpfulCount: 0,
              notHelpfulCount: 0
            };
          }
          throw response.error;
        }
        return this.mapDbRatingToModel(response.data);
      }),
      catchError(error => {
        // Only show error if it's not the "no rows returned" error
        if (error.code !== 'PGRST116') {
          this.notificationService.error(`Failed to fetch ratings: ${error.message}`);
        }
        
        // Return default values
        return [{
          knowledgeBaseId,
          totalRatings: 0,
          averageRating: 0,
          helpfulCount: 0,
          notHelpfulCount: 0
        }];
      })
    );
  }

  /**
   * Get analytics data for a knowledge base entry
   */
  getAnalytics(knowledgeBaseId: string): Observable<any> {
    return from(this.supabaseService.supabaseClient.rpc(
      'get_kb_analytics',
      { kb_id: knowledgeBaseId }
    )).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch analytics: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate a session ID for tracking
   */
  private getSessionId(): string {
    let sessionId = localStorage.getItem('kb_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('kb_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Map database feedback to frontend model
   */
  private mapDbFeedbackToModel(dbFeedback: any): KnowledgeBaseFeedback {
    return {
      id: dbFeedback.id,
      knowledgeBaseId: dbFeedback.knowledge_base_id,
      userId: dbFeedback.user_id,
      rating: dbFeedback.rating,
      feedbackText: dbFeedback.feedback_text,
      isHelpful: dbFeedback.is_helpful,
      status: dbFeedback.status,
      adminResponse: dbFeedback.admin_response,
      reviewedBy: dbFeedback.reviewed_by,
      reviewedAt: dbFeedback.reviewed_at,
      createdAt: dbFeedback.created_at,
      updatedAt: dbFeedback.updated_at
    };
  }

  /**
   * Map database rating to frontend model
   */
  private mapDbRatingToModel(dbRating: any): KnowledgeBaseRating {
    return {
      knowledgeBaseId: dbRating.knowledge_base_id,
      totalRatings: dbRating.total_ratings,
      averageRating: dbRating.average_rating,
      helpfulCount: dbRating.helpful_count,
      notHelpfulCount: dbRating.not_helpful_count
    };
  }
}
