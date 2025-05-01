// src/app/features/ecommerce/product-knowledge-base/knowledge-base-history.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductKnowledgeBase, KnowledgeBaseHistory } from '../models/product-knowledge-base.model';
import { KnowledgeBaseHistoryService } from '../services/knowledge-base-history.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-knowledge-base-history',
  templateUrl: './knowledge-base-history.component.html',
  styles: [],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class KnowledgeBaseHistoryComponent implements OnInit {
  @Input() knowledgeBaseEntry!: ProductKnowledgeBase;

  historyEntries: KnowledgeBaseHistory[] = [];
  isLoading = true;

  // Version comparison
  selectedVersions: number[] = [];
  comparisonResult: { version1: KnowledgeBaseHistory; version2: KnowledgeBaseHistory } | null = null;

  // Version restoration
  showRestoreConfirm = false;
  versionToRestore: number | null = null;
  isRestoring = false;

  // Manual version
  showManualVersionForm = false;
  changeSummary = '';
  isCreatingVersion = false;

  constructor(
    private historyService: KnowledgeBaseHistoryService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Load version history for the knowledge base entry
   */
  loadHistory(): void {
    this.isLoading = true;
    this.historyService.getHistory(this.knowledgeBaseEntry.id).subscribe({
      next: (history) => {
        this.historyEntries = history;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Toggle version selection for comparison
   */
  toggleVersionSelection(version: number): void {
    const index = this.selectedVersions.indexOf(version);

    if (index === -1) {
      // Add version if not already selected and we have less than 2 selections
      if (this.selectedVersions.length < 2) {
        this.selectedVersions.push(version);
      } else {
        // Replace the oldest selection
        this.selectedVersions.shift();
        this.selectedVersions.push(version);
      }
    } else {
      // Remove version if already selected
      this.selectedVersions.splice(index, 1);
    }

    // Clear comparison result when selection changes
    this.comparisonResult = null;
  }

  /**
   * Compare selected versions
   */
  compareVersions(): void {
    if (this.selectedVersions.length !== 2) {
      this.notificationService.warning('Please select two versions to compare.');
      return;
    }

    const [version1, version2] = this.selectedVersions.sort((a, b) => a - b);

    this.historyService.compareVersions(
      this.knowledgeBaseEntry.id,
      version1,
      version2
    ).subscribe({
      next: (result) => {
        this.comparisonResult = result;
      },
      error: (error) => {
        console.error('Error comparing versions:', error);
      }
    });
  }

  /**
   * Show restore confirmation for a version
   */
  confirmRestore(version: number): void {
    this.showRestoreConfirm = true;
    this.versionToRestore = version;
  }

  /**
   * Cancel restore
   */
  cancelRestore(): void {
    this.showRestoreConfirm = false;
    this.versionToRestore = null;
  }

  /**
   * Restore a version
   */
  restoreVersion(): void {
    if (!this.versionToRestore) {
      return;
    }

    this.isRestoring = true;
    this.historyService.restoreVersion(
      this.knowledgeBaseEntry.id,
      this.versionToRestore
    ).subscribe({
      next: () => {
        this.isRestoring = false;
        this.showRestoreConfirm = false;
        this.versionToRestore = null;

        // Reload the page to show the restored version
        window.location.reload();
      },
      error: (error) => {
        console.error('Error restoring version:', error);
        this.isRestoring = false;
      }
    });
  }

  /**
   * Toggle manual version form
   */
  toggleManualVersionForm(): void {
    this.showManualVersionForm = !this.showManualVersionForm;

    if (this.showManualVersionForm) {
      this.changeSummary = '';
    }
  }

  /**
   * Create a manual version
   */
  createManualVersion(): void {
    if (!this.changeSummary) {
      this.notificationService.warning('Please provide a change summary.');
      return;
    }

    this.isCreatingVersion = true;
    this.historyService.addManualVersion(
      this.knowledgeBaseEntry.id,
      this.changeSummary
    ).subscribe({
      next: () => {
        this.isCreatingVersion = false;
        this.showManualVersionForm = false;
        this.changeSummary = '';
        this.loadHistory();
      },
      error: (error) => {
        console.error('Error creating version:', error);
        this.isCreatingVersion = false;
      }
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'Unknown date';
    }

    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
