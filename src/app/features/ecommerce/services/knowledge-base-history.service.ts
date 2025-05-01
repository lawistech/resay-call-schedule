// src/app/features/ecommerce/services/knowledge-base-history.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { KnowledgeBaseHistory } from '../models/product-knowledge-base.model';
import { ProductKnowledgeBaseService } from './product-knowledge-base.service';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseHistoryService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private knowledgeBaseService: ProductKnowledgeBaseService
  ) {}

  /**
   * Get version history for a knowledge base entry
   */
  getHistory(knowledgeBaseId: string): Observable<KnowledgeBaseHistory[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_history')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('version', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(history => this.mapDbHistoryToModel(history));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch version history: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific version of a knowledge base entry
   */
  getVersion(knowledgeBaseId: string, version: number): Observable<KnowledgeBaseHistory> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_history')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .eq('version', version)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.mapDbHistoryToModel(response.data);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch version: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Restore a previous version of a knowledge base entry
   */
  restoreVersion(knowledgeBaseId: string, version: number): Observable<void> {
    return this.getVersion(knowledgeBaseId, version).pipe(
      switchMap(historyEntry => {
        // Update the current knowledge base entry with the historical data
        return this.knowledgeBaseService.updateKnowledgeBaseEntry(knowledgeBaseId, {
          title: historyEntry.title,
          content: historyEntry.content,
          category: historyEntry.category,
          tags: historyEntry.tags
        });
      }),
      map(() => {
        this.notificationService.success(`Version ${version} restored successfully`);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to restore version: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a manual version with a change summary
   */
  addManualVersion(knowledgeBaseId: string, changeSummary: string): Observable<void> {
    // First get the current entry
    return this.knowledgeBaseService.getKnowledgeBaseEntryById(knowledgeBaseId).pipe(
      switchMap(entry => {
        // Get the latest version number
        return from(this.supabaseService.supabaseClient
          .from('product_kb_history')
          .select('version')
          .eq('knowledge_base_id', knowledgeBaseId)
          .order('version', { ascending: false })
          .limit(1)
        ).pipe(
          switchMap(async response => {
            if (response.error) throw response.error;
            const nextVersion = response.data.length > 0 ? response.data[0].version + 1 : 1;

            // Get current user
            const { data } = await this.supabaseService.supabaseClient.auth.getUser();

            // Create a new history entry
            const historyEntry = {
              knowledge_base_id: knowledgeBaseId,
              product_id: entry.productId,
              title: entry.title,
              content: entry.content,
              category: entry.category,
              tags: entry.tags || [],
              version: nextVersion,
              changed_by: data.user?.id,
              change_summary: changeSummary
            };

            return historyEntry;
          })
        );
      }),
      switchMap(historyEntry => {
        return from(this.supabaseService.supabaseClient
          .from('product_kb_history')
          .insert(historyEntry)
        );
      }),
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Version saved successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to save version: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Compare two versions of a knowledge base entry
   */
  compareVersions(knowledgeBaseId: string, version1: number, version2: number): Observable<{
    version1: KnowledgeBaseHistory;
    version2: KnowledgeBaseHistory;
  }> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_history')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .in('version', [version1, version2])
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        if (response.data.length !== 2) {
          throw new Error('Could not find both versions for comparison');
        }

        const v1 = response.data.find(v => v.version === version1);
        const v2 = response.data.find(v => v.version === version2);

        if (!v1 || !v2) {
          throw new Error('Could not find both versions for comparison');
        }

        return {
          version1: this.mapDbHistoryToModel(v1),
          version2: this.mapDbHistoryToModel(v2)
        };
      }),
      catchError(error => {
        this.notificationService.error(`Failed to compare versions: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Map database history entry to frontend model
   */
  private mapDbHistoryToModel(dbHistory: any): KnowledgeBaseHistory {
    return {
      id: dbHistory.id,
      knowledgeBaseId: dbHistory.knowledge_base_id,
      productId: dbHistory.product_id,
      title: dbHistory.title,
      content: dbHistory.content,
      category: dbHistory.category,
      tags: dbHistory.tags,
      version: dbHistory.version,
      changedBy: dbHistory.changed_by,
      changeSummary: dbHistory.change_summary,
      createdAt: dbHistory.created_at
    };
  }
}
