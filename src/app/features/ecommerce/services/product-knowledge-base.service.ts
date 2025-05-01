// src/app/features/ecommerce/services/product-knowledge-base.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ProductKnowledgeBase,
  CompetitiveAnalysis,
  ProductKnowledgeBaseComplete,
  KnowledgeBaseCategory
} from '../models/product-knowledge-base.model';
import { ProductCatalogService } from './product-catalog.service';

@Injectable({
  providedIn: 'root'
})
export class ProductKnowledgeBaseService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private productCatalogService: ProductCatalogService
  ) {}

  /**
   * Get all knowledge base entries
   */
  getKnowledgeBaseEntries(): Observable<ProductKnowledgeBase[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_knowledge_base')
      .select(`
        *,
        product:product_catalog(*)
      `)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Convert snake_case to camelCase for frontend
        return response.data.map(entry => this.mapDbEntryToModel(entry));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch knowledge base entries: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get knowledge base entries by product ID
   */
  getKnowledgeBaseEntriesByProduct(productId: string): Observable<ProductKnowledgeBase[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_knowledge_base')
      .select(`
        *,
        product:product_catalog(*)
      `)
      .eq('product_id', productId)
      .order('category', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(entry => this.mapDbEntryToModel(entry));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch knowledge base entries: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get knowledge base entries by category
   */
  getKnowledgeBaseEntriesByCategory(category: KnowledgeBaseCategory): Observable<ProductKnowledgeBase[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_knowledge_base')
      .select(`
        *,
        product:product_catalog(*)
      `)
      .eq('category', category)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(entry => this.mapDbEntryToModel(entry));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch knowledge base entries: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a knowledge base entry by ID
   */
  getKnowledgeBaseEntryById(id: string): Observable<ProductKnowledgeBase> {
    return from(this.supabaseService.supabaseClient
      .from('product_knowledge_base')
      .select(`
        *,
        product:product_catalog(*)
      `)
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.mapDbEntryToModel(response.data);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch knowledge base entry: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a complete knowledge base for a product
   */
  getCompleteKnowledgeBase(productId: string): Observable<ProductKnowledgeBaseComplete> {
    return forkJoin({
      product: this.productCatalogService.getProductById(productId),
      entries: this.getKnowledgeBaseEntriesByProduct(productId),
      competitiveAnalysis: this.getCompetitiveAnalysisByProduct(productId),
      // Add new data sources for enhanced features
      attachments: this.getAttachments(productId),
      ratings: this.getRatings(productId),
      popularEntries: this.getPopularEntries(productId)
    }).pipe(
      map(({ product, entries, competitiveAnalysis, attachments, ratings, popularEntries }) => {
        // Organize entries by category
        const technicalSpecs = entries.filter(e => e.category === 'technical_specs');
        const usageScenarios = entries.filter(e => e.category === 'usage_scenarios');
        const faqs = entries.filter(e => e.category === 'faq');
        const competitiveEntries = entries.filter(e => e.category === 'competitive_analysis');

        return {
          product,
          technicalSpecs,
          usageScenarios,
          faqs,
          competitiveAnalysis: {
            entries: competitiveEntries,
            details: competitiveAnalysis
          },
          // Include new data
          attachments,
          ratings,
          popularEntries
        };
      })
    );
  }

  /**
   * Get attachments for a product
   */
  private getAttachments(productId: string): Observable<any[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_attachments')
      .select(`
        *,
        knowledge_base:knowledge_base_id(
          id,
          product_id,
          title,
          category
        )
      `)
      .eq('knowledge_base_id.product_id', productId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        console.error('Failed to fetch attachments:', error);
        return [];
      })
    );
  }

  /**
   * Get ratings for a product's knowledge base entries
   */
  private getRatings(productId: string): Observable<any[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_ratings')
      .select(`
        *,
        knowledge_base:knowledge_base_id(
          id,
          product_id,
          title,
          category
        )
      `)
      .eq('knowledge_base_id.product_id', productId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        console.error('Failed to fetch ratings:', error);
        return [];
      })
    );
  }

  /**
   * Get popular entries for a product
   */
  private getPopularEntries(productId: string): Observable<any[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_popular')
      .select(`
        *,
        knowledge_base:knowledge_base_id(*)
      `)
      .eq('knowledge_base_id.product_id', productId)
      .order('total_score', { ascending: false })
      .limit(5)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(item => item.knowledge_base);
      }),
      catchError(error => {
        console.error('Failed to fetch popular entries:', error);
        return [];
      })
    );
  }

  /**
   * Create a new knowledge base entry
   */
  createKnowledgeBaseEntry(entry: Partial<ProductKnowledgeBase>): Observable<ProductKnowledgeBase> {
    const currentUser = this.authService.getCurrentUser();

    // Convert camelCase to snake_case for database
    const dbEntry = {
      product_id: entry.productId,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags || [],
      created_by: currentUser?.id,
      is_active: entry.isActive !== undefined ? entry.isActive : true
    };

    return from(this.supabaseService.supabaseClient
      .from('product_knowledge_base')
      .insert(dbEntry)
      .select(`
        *,
        product:product_catalog(*)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Knowledge base entry created successfully');
        return this.mapDbEntryToModel(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create knowledge base entry: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a knowledge base entry
   */
  updateKnowledgeBaseEntry(id: string, entry: Partial<ProductKnowledgeBase>): Observable<ProductKnowledgeBase> {
    // Convert camelCase to snake_case for database
    const dbEntry: any = {};

    if (entry.productId !== undefined) dbEntry.product_id = entry.productId;
    if (entry.title !== undefined) dbEntry.title = entry.title;
    if (entry.content !== undefined) dbEntry.content = entry.content;
    if (entry.category !== undefined) dbEntry.category = entry.category;
    if (entry.tags !== undefined) dbEntry.tags = entry.tags;
    if (entry.isActive !== undefined) dbEntry.is_active = entry.isActive;

    // Always update the updated_at timestamp
    dbEntry.updated_at = new Date().toISOString();

    return from(this.supabaseService.supabaseClient
      .from('product_knowledge_base')
      .update(dbEntry)
      .eq('id', id)
      .select(`
        *,
        product:product_catalog(*)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Knowledge base entry updated successfully');
        return this.mapDbEntryToModel(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update knowledge base entry: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a knowledge base entry
   */
  deleteKnowledgeBaseEntry(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('product_knowledge_base')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Knowledge base entry deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete knowledge base entry: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get competitive analysis entries by product ID
   */
  getCompetitiveAnalysisByProduct(productId: string): Observable<CompetitiveAnalysis[]> {
    // First get the knowledge base entries for competitive analysis
    return this.getKnowledgeBaseEntriesByProduct(productId).pipe(
      switchMap(entries => {
        // Filter for competitive analysis entries
        const competitiveEntries = entries.filter(e => e.category === 'competitive_analysis');

        if (competitiveEntries.length === 0) {
          return of([]);
        }

        // Get the IDs of competitive analysis entries
        const kbIds = competitiveEntries.map(e => e.id);

        // Get detailed competitive analysis data
        return from(this.supabaseService.supabaseClient
          .from('product_kb_competitive_analysis')
          .select('*')
          .in('knowledge_base_id', kbIds)
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            return response.data.map(analysis => this.mapDbAnalysisToModel(analysis));
          })
        );
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch competitive analysis: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a competitive analysis entry
   */
  createCompetitiveAnalysis(analysis: Partial<CompetitiveAnalysis>): Observable<CompetitiveAnalysis> {
    // Convert camelCase to snake_case for database
    const dbAnalysis = {
      knowledge_base_id: analysis.knowledgeBaseId,
      competitor_name: analysis.competitorName,
      competitor_product: analysis.competitorProduct,
      comparison_points: analysis.comparisonPoints || {},
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || []
    };

    return from(this.supabaseService.supabaseClient
      .from('product_kb_competitive_analysis')
      .insert(dbAnalysis)
      .select('*')
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Competitive analysis created successfully');
        return this.mapDbAnalysisToModel(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create competitive analysis: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a competitive analysis entry
   */
  updateCompetitiveAnalysis(id: string, analysis: Partial<CompetitiveAnalysis>): Observable<CompetitiveAnalysis> {
    // Convert camelCase to snake_case for database
    const dbAnalysis: any = {};

    if (analysis.knowledgeBaseId !== undefined) dbAnalysis.knowledge_base_id = analysis.knowledgeBaseId;
    if (analysis.competitorName !== undefined) dbAnalysis.competitor_name = analysis.competitorName;
    if (analysis.competitorProduct !== undefined) dbAnalysis.competitor_product = analysis.competitorProduct;
    if (analysis.comparisonPoints !== undefined) dbAnalysis.comparison_points = analysis.comparisonPoints;
    if (analysis.strengths !== undefined) dbAnalysis.strengths = analysis.strengths;
    if (analysis.weaknesses !== undefined) dbAnalysis.weaknesses = analysis.weaknesses;

    // Always update the updated_at timestamp
    dbAnalysis.updated_at = new Date().toISOString();

    return from(this.supabaseService.supabaseClient
      .from('product_kb_competitive_analysis')
      .update(dbAnalysis)
      .eq('id', id)
      .select('*')
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Competitive analysis updated successfully');
        return this.mapDbAnalysisToModel(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update competitive analysis: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a competitive analysis entry
   */
  deleteCompetitiveAnalysis(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_competitive_analysis')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Competitive analysis deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete competitive analysis: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Map database entry to frontend model
   */
  private mapDbEntryToModel(dbEntry: any): ProductKnowledgeBase {
    return {
      id: dbEntry.id,
      productId: dbEntry.product_id,
      product: dbEntry.product ? {
        id: dbEntry.product.id,
        supplierId: dbEntry.product.supplier_id,
        name: dbEntry.product.name,
        sku: dbEntry.product.sku,
        description: dbEntry.product.description,
        price: dbEntry.product.price,
        cost: dbEntry.product.cost,
        stockQuantity: dbEntry.product.stock_quantity,
        category: dbEntry.product.category,
        tags: dbEntry.product.tags,
        imageUrl: dbEntry.product.image_url,
        isActive: dbEntry.product.is_active,
        createdAt: dbEntry.product.created_at,
        updatedAt: dbEntry.product.updated_at
      } : undefined,
      title: dbEntry.title,
      content: dbEntry.content,
      category: dbEntry.category,
      tags: dbEntry.tags,
      createdBy: dbEntry.created_by,
      isActive: dbEntry.is_active,
      createdAt: dbEntry.created_at,
      updatedAt: dbEntry.updated_at
    };
  }

  /**
   * Map database competitive analysis to frontend model
   */
  private mapDbAnalysisToModel(dbAnalysis: any): CompetitiveAnalysis {
    return {
      id: dbAnalysis.id,
      knowledgeBaseId: dbAnalysis.knowledge_base_id,
      competitorName: dbAnalysis.competitor_name,
      competitorProduct: dbAnalysis.competitor_product,
      comparisonPoints: dbAnalysis.comparison_points,
      strengths: dbAnalysis.strengths,
      weaknesses: dbAnalysis.weaknesses,
      createdAt: dbAnalysis.created_at,
      updatedAt: dbAnalysis.updated_at
    };
  }
}
