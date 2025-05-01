// src/app/features/ecommerce/product-knowledge-base/knowledge-base-attachments.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeBaseAttachment, ProductKnowledgeBase } from '../models/product-knowledge-base.model';
import { KnowledgeBaseAttachmentService } from '../services/knowledge-base-attachment.service';
import { KnowledgeBaseAnalyticsService } from '../services/knowledge-base-analytics.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-knowledge-base-attachments',
  templateUrl: './knowledge-base-attachments.component.html',
  styles: [],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class KnowledgeBaseAttachmentsComponent implements OnInit {
  @Input() knowledgeBaseEntry!: ProductKnowledgeBase;

  attachments: KnowledgeBaseAttachment[] = [];
  isLoading = true;

  // File upload
  selectedFile: File | null = null;
  fileDescription = '';
  isUploading = false;

  // Allowed file types
  allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv'
  ];

  // Max file size (5MB)
  maxFileSize = 5 * 1024 * 1024;

  constructor(
    private attachmentService: KnowledgeBaseAttachmentService,
    private analyticsService: KnowledgeBaseAnalyticsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAttachments();
  }

  /**
   * Load attachments for the knowledge base entry
   */
  loadAttachments(): void {
    this.isLoading = true;
    this.attachmentService.getAttachments(this.knowledgeBaseEntry.id).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attachments:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check file type
      if (!this.allowedFileTypes.includes(file.type)) {
        this.notificationService.error('Invalid file type. Please select a supported file type.');
        input.value = '';
        return;
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        this.notificationService.error('File is too large. Maximum size is 5MB.');
        input.value = '';
        return;
      }

      this.selectedFile = file;
    }
  }

  /**
   * Upload the selected file
   */
  uploadFile(): void {
    if (!this.selectedFile) {
      this.notificationService.warning('Please select a file to upload.');
      return;
    }

    this.isUploading = true;
    this.attachmentService.uploadAttachment(
      this.selectedFile,
      this.knowledgeBaseEntry.id,
      this.fileDescription
    ).subscribe({
      next: () => {
        this.isUploading = false;
        this.selectedFile = null;
        this.fileDescription = '';
        this.loadAttachments();

        // Reset the file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.isUploading = false;
      }
    });
  }

  /**
   * Delete an attachment
   */
  deleteAttachment(attachment: KnowledgeBaseAttachment): void {
    if (confirm(`Are you sure you want to delete "${attachment.fileName}"?`)) {
      this.attachmentService.deleteAttachment(attachment.id).subscribe({
        next: () => {
          this.loadAttachments();
        },
        error: (error) => {
          console.error('Error deleting attachment:', error);
        }
      });
    }
  }

  /**
   * Download an attachment
   */
  downloadAttachment(attachment: KnowledgeBaseAttachment): void {
    this.attachmentService.getDownloadUrl(attachment.filePath).subscribe({
      next: (url) => {
        // Track the download
        this.analyticsService.trackAction(
          this.knowledgeBaseEntry.id,
          'download'
        ).subscribe();

        // Increment the download count
        this.attachmentService.incrementDownloadCount(attachment.id).subscribe();

        // Open the download URL
        window.open(url, '_blank');
      },
      error: (error) => {
        console.error('Error getting download URL:', error);
      }
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'fa-file-word';
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return 'fa-file-excel';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return 'fa-file-powerpoint';
    } else if (fileType.includes('image')) {
      return 'fa-file-image';
    } else if (fileType.includes('text') || fileType.includes('csv')) {
      return 'fa-file-alt';
    } else {
      return 'fa-file';
    }
  }
}
