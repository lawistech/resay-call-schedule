// src/app/features/customer-journey/components/touchpoint-details/touchpoint-details.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerTouchpoint } from '../../../../core/models/customer-journey.model';

@Component({
  selector: 'app-touchpoint-details',
  templateUrl: './touchpoint-details.component.html',
  styleUrls: ['./touchpoint-details.component.scss']
})
export class TouchpointDetailsComponent implements OnInit {
  @Input() touchpoint: CustomerTouchpoint | null = null;
  @Input() isEditing = false;
  @Input() customerId: string = '';
  @Input() companyId: string = '';
  @Input() journeyId: string = '';
  @Input() stageId: string = '';
  
  @Output() save = new EventEmitter<Partial<CustomerTouchpoint>>();
  @Output() cancel = new EventEmitter<void>();
  
  touchpointForm: FormGroup;
  
  touchpointTypes = [
    { value: 'email', label: 'Email' },
    { value: 'call', label: 'Call' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'quote', label: 'Quote' },
    { value: 'order', label: 'Order' },
    { value: 'website', label: 'Website Visit' },
    { value: 'other', label: 'Other' }
  ];
  
  channels = [
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'in_person', label: 'In Person' },
    { value: 'web', label: 'Web' },
    { value: 'social', label: 'Social Media' },
    { value: 'other', label: 'Other' }
  ];
  
  outcomes = [
    { value: 'positive', label: 'Positive' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'negative', label: 'Negative' }
  ];

  constructor(private fb: FormBuilder) {
    this.touchpointForm = this.fb.group({
      type: ['email', Validators.required],
      subtype: [''],
      channel: ['email', Validators.required],
      timestamp: [new Date().toISOString().substring(0, 16), Validators.required],
      description: [''],
      outcome: ['neutral'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    if (this.touchpoint && this.isEditing) {
      this.touchpointForm.patchValue({
        type: this.touchpoint.type,
        subtype: this.touchpoint.subtype || '',
        channel: this.touchpoint.channel,
        timestamp: new Date(this.touchpoint.timestamp).toISOString().substring(0, 16),
        description: this.touchpoint.description || '',
        outcome: this.touchpoint.outcome || 'neutral',
        notes: this.touchpoint.notes || ''
      });
    }
  }

  onSubmit(): void {
    if (this.touchpointForm.invalid) {
      return;
    }
    
    const formValues = this.touchpointForm.value;
    
    const touchpoint: Partial<CustomerTouchpoint> = {
      ...formValues,
      customerId: this.customerId,
      companyId: this.companyId,
      metadata: {
        stageId: this.stageId
      }
    };
    
    if (this.touchpoint && this.isEditing) {
      touchpoint.id = this.touchpoint.id;
    }
    
    this.save.emit(touchpoint);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
