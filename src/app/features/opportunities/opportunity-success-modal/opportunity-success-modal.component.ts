import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Opportunity } from '../../../core/models/company.model';

@Component({
  selector: 'app-opportunity-success-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-success-modal.component.html',
  styleUrl: './opportunity-success-modal.component.css'
})
export class OpportunitySuccessModalComponent {
  @Input() show: boolean = false;
  @Input() opportunity: Opportunity | null = null;
  @Output() closeEvent = new EventEmitter<boolean>();
  @Output() successEvent = new EventEmitter<{opportunity: Opportunity, notes: string}>();

  successNotes: string = '';
  isSubmitting: boolean = false;

  close() {
    this.closeEvent.emit(false);
    this.resetForm();
  }

  submitSuccess() {
    if (!this.opportunity) return;

    this.isSubmitting = true;
    this.successEvent.emit({
      opportunity: this.opportunity,
      notes: this.successNotes
    });
  }

  resetForm() {
    this.successNotes = '';
    this.isSubmitting = false;
  }
}
