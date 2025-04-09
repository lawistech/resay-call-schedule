// src/app/shared/post-call-modal/post-call-modal.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { Call } from '../../core/models/call.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-post-call-modal',
  templateUrl: './post-call-modal.component.html'
})
export class PostCallModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() call: Call | null = null;
  @Output() closed = new EventEmitter<void>();
  @Input() initialAction: 'complete' | 'reschedule' = 'complete'; 
  @Output() completed = new EventEmitter<{callId: string, notes: string}>();
  @Output() rescheduled = new EventEmitter<{callId: string, scheduledAt: string, notes: string}>();
  
  postCallForm!: FormGroup;
  selectedAction: 'complete' | 'reschedule' = 'complete';
  
  constructor(
    private formBuilder: FormBuilder,
    private clipboard: Clipboard,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    
    // Initialize selectedAction based on the input parameter
    this.selectedAction = this.initialAction;
    
    // Watch for changes to the call input
    if (this.call) {
      // Initialize the form with existing call data
      this.postCallForm.patchValue({
        notes: this.call.notes || '',
        scheduledAt: new Date().toISOString().slice(0, 16) // Default to current time
      });
    }
  }
  
  initForm(): void {
    this.postCallForm = this.formBuilder.group({
      notes: [''],
      scheduledAt: [new Date().toISOString().slice(0, 16)] // Default to current date/time
    });
  }
  
  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }
  
  submitForm(): void {
    if (this.postCallForm.invalid || !this.call) {
      return;
    }
    
    if (this.selectedAction === 'complete') {
      this.completed.emit({
        callId: this.call.id,
        notes: this.postCallForm.value.notes
      });
    } else {
      this.rescheduled.emit({
        callId: this.call.id,
        scheduledAt: this.postCallForm.value.scheduledAt,
        notes: this.postCallForm.value.notes
      });
    }
  }
  
  // Copy phone number to clipboard
  copyPhoneNumber(phone: string | undefined): void {
    if (!phone) {
      this.notificationService.warning('No phone number available');
      return;
    }
    
    this.clipboard.copy(phone);
    this.notificationService.success('Phone number copied to clipboard');
  }

  // Copy email to clipboard
  copyEmail(email: string | undefined): void {
    if (!email) {
      this.notificationService.warning('No email available');
      return;
    }
    
    this.clipboard.copy(email);
    this.notificationService.success('Email copied to clipboard');
  }
}