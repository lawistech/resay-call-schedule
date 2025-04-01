import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Opportunity } from '../../../core/models/company.model';
import { OpportunitiesService } from '../opportunities.service';

@Component({
  selector: 'app-opportunity-form',
  templateUrl: './opportunity-form.component.html',
  styleUrls: ['./opportunity-form.component.css']
})
export class OpportunityFormComponent implements OnInit {
  @Input() opportunity: Opportunity | null = null;
  @Input() isSaving: boolean = false;
  @Output() formSubmitted = new EventEmitter<Opportunity>();
  opportunityForm: FormGroup;
  stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed-Won'];

  constructor(
    private fb: FormBuilder,
    private opportunitiesService: OpportunitiesService
  ) {
    this.opportunityForm = this.fb.group({
      name: ['', Validators.required],
      companyId: ['', Validators.required],
      stage: ['Prospecting', Validators.required],
      value: [null, [Validators.required, Validators.min(0)]],
      closeDate: [null],
      notes: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.opportunityForm.valid) {
      const newOpportunity: Opportunity = {
        ...this.opportunityForm.value,
        id: this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.opportunitiesService.addOpportunity(newOpportunity).subscribe({
        next: (opportunity) => {
          this.formSubmitted.emit(opportunity);
          this.opportunityForm.reset({
            stage: 'Prospecting'
          });
        },
        error: (err) => console.error('Error saving opportunity', err)
      });
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
