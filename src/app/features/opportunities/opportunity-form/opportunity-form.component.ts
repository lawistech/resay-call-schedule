import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Opportunity } from '../../../core/models/company.model';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './opportunity-form.component.html',
  styleUrls: ['./opportunity-form.component.css']
})
export class OpportunityFormComponent implements OnInit {
  @Input() opportunity: Opportunity | null = null;
  @Input() isSaving: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<Partial<Opportunity>>();
  
  opportunityForm: FormGroup;
  stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed-Won'];
  statuses = ['New', 'In Progress', 'Won', 'Lost'];

  constructor(private fb: FormBuilder) {
    this.opportunityForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['New', Validators.required],
      stage: ['Prospecting', Validators.required],
      probability: [0, [Validators.min(0), Validators.max(100)]],
      expectedCloseDate: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      companyId: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    if (this.opportunity) {
      // For edit mode, populate the form with opportunity data
      this.opportunityForm.patchValue({
        title: this.opportunity.title,
        description: this.opportunity.description,
        status: this.opportunity.status,
        stage: this.opportunity.stage,
        probability: this.opportunity.probability,
        expectedCloseDate: this.formatDateForInput(this.opportunity.expectedCloseDate),
        amount: this.opportunity.amount,
        companyId: this.opportunity.companyId,
        notes: this.opportunity.notes
      });
    }
  }

  onSubmit(): void {
    if (this.opportunityForm.valid) {
      const formValue = this.opportunityForm.value;
      
      // Create the opportunity data object
      const opportunityData: Partial<Opportunity> = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        stage: formValue.stage,
        probability: formValue.probability,
        expectedCloseDate: new Date(formValue.expectedCloseDate),
        amount: formValue.amount,
        companyId: formValue.companyId,
        notes: formValue.notes
      };

      // If editing, add the ID
      if (this.opportunity && this.opportunity.id) {
        opportunityData.id = this.opportunity.id;
      }

      this.formSubmitted.emit(opportunityData);
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  // Helper function to format date for input field
  private formatDateForInput(date: Date | string | undefined): string | null {
    if (!date) return null;
    
    const d = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return null;
    
    // Format as YYYY-MM-DD for the input[type="date"]
    return d.toISOString().split('T')[0];
  }
}