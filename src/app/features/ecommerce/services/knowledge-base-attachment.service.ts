// src/app/features/ecommerce/services/knowledge-base-attachment.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { KnowledgeBaseAttachment } from '../models/product-knowledge-base.model';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseAttachmentService {
  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  /**
   * Get attachments for a knowledge base entry
   */
  getAttachments(knowledgeBaseId: string): Observable<KnowledgeBaseAttachment[]> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_attachments')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(attachment => this.mapDbAttachmentToModel(attachment));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch attachments: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload a file attachment
   */
  uploadAttachment(file: File, knowledgeBaseId: string, description?: string): Observable<KnowledgeBaseAttachment> {
    const currentUser = this.authService.getCurrentUser();
    const filePath = `knowledge-base/${knowledgeBaseId}/${Date.now()}_${file.name}`;
    
    // First upload the file to storage
    return from(this.supabaseService.supabaseClient.storage
      .from('attachments')
      .upload(filePath, file)
    ).pipe(
      switchMap(uploadResponse => {
        if (uploadResponse.error) throw uploadResponse.error;
        
        // Then create the attachment record
        const attachment = {
          knowledge_base_id: knowledgeBaseId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          description: description || '',
          uploaded_by: currentUser?.id,
          is_active: true
        };
        
        return from(this.supabaseService.supabaseClient
          .from('product_kb_attachments')
          .insert(attachment)
          .select('*')
        );
      }),
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('File uploaded successfully');
        return this.mapDbAttachmentToModel(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to upload file: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an attachment
   */
  deleteAttachment(attachmentId: string): Observable<void> {
    // First get the attachment to get the file path
    return from(this.supabaseService.supabaseClient
      .from('product_kb_attachments')
      .select('file_path')
      .eq('id', attachmentId)
      .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        const filePath = response.data.file_path;
        
        // Delete the file from storage
        return from(this.supabaseService.supabaseClient.storage
          .from('attachments')
          .remove([filePath])
        );
      }),
      switchMap(removeResponse => {
        if (removeResponse.error) throw removeResponse.error;
        
        // Delete the attachment record
        return from(this.supabaseService.supabaseClient
          .from('product_kb_attachments')
          .delete()
          .eq('id', attachmentId)
        );
      }),
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Attachment deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete attachment: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a download URL for an attachment
   */
  getDownloadUrl(filePath: string): Observable<string> {
    return from(this.supabaseService.supabaseClient.storage
      .from('attachments')
      .createSignedUrl(filePath, 60 * 60) // 1 hour expiry
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.signedUrl;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to get download URL: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Increment the download count for an attachment
   */
  incrementDownloadCount(attachmentId: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('product_kb_attachments')
      .update({ download_count: this.supabaseService.supabaseClient.rpc('increment', { count: 1 }) })
      .eq('id', attachmentId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
      }),
      catchError(error => {
        console.error('Failed to increment download count:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Map database attachment to frontend model
   */
  private mapDbAttachmentToModel(dbAttachment: any): KnowledgeBaseAttachment {
    return {
      id: dbAttachment.id,
      knowledgeBaseId: dbAttachment.knowledge_base_id,
      fileName: dbAttachment.file_name,
      fileType: dbAttachment.file_type,
      fileSize: dbAttachment.file_size,
      filePath: dbAttachment.file_path,
      description: dbAttachment.description,
      uploadedBy: dbAttachment.uploaded_by,
      downloadCount: dbAttachment.download_count,
      isActive: dbAttachment.is_active,
      createdAt: dbAttachment.created_at,
      updatedAt: dbAttachment.updated_at
    };
  }
}
