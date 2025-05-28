// src/app/shared/post-call-modal/post-call-modal.component.ts
import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { Call } from '../../core/models/call.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-post-call-modal',
  templateUrl: './post-call-modal.component.html'
})
export class PostCallModalComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Input() call: Call | null = null;
  @Output() closed = new EventEmitter<void>();
  @Input() initialAction: 'complete' | 'reschedule' = 'complete';
  @Output() completed = new EventEmitter<{callId: string, notes: string}>();
  @Output() rescheduled = new EventEmitter<{callId: string, scheduledAt: string, notes: string}>();

  @ViewChild('notesField', { static: false }) notesField!: ElementRef<HTMLTextAreaElement>;

  postCallForm!: FormGroup;
  selectedAction: 'complete' | 'reschedule' = 'complete';

  constructor(
    private formBuilder: FormBuilder,
    private clipboard: Clipboard,
    private notificationService: NotificationService
  ) {}

  // Handle ESC key to close modal
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      this.close();
    }
  }

  ngAfterViewInit(): void {
    // Focus on notes field when modal opens in complete mode
    if (this.isOpen && this.selectedAction === 'complete') {
      this.focusNotesField();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('PostCallModal: ngOnChanges called with', changes);

    // Handle changes to isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      console.log('PostCallModal: Modal is now open');
      // Focus on notes field when modal opens in complete mode
      setTimeout(() => {
        if (this.selectedAction === 'complete') {
          this.focusNotesField();
        }
      }, 100);
    }

    // Handle changes to call
    if (changes['call'] && changes['call'].currentValue) {
      console.log('PostCallModal: Call changed to', this.call);

      // Make sure the form is initialized
      if (!this.postCallForm) {
        this.initForm();
      }

      // Update the form with the new call data
      this.postCallForm.patchValue({
        notes: this.call?.notes || '',
        scheduledAt: new Date().toISOString().slice(0, 16) // Default to current time
      });
    }

    // Handle changes to initialAction
    if (changes['initialAction'] && changes['initialAction'].currentValue) {
      this.selectedAction = this.initialAction;
      console.log('PostCallModal: selectedAction updated to', this.selectedAction);
      // Focus on notes field when action is set to complete
      setTimeout(() => {
        if (this.selectedAction === 'complete' && this.isOpen) {
          this.focusNotesField();
        }
      }, 100);
    }
  }

  ngOnInit(): void {
    console.log('PostCallModal: ngOnInit called');
    console.log('PostCallModal: isOpen =', this.isOpen);
    console.log('PostCallModal: call =', this.call);

    this.initForm();

    // Initialize selectedAction based on the input parameter
    this.selectedAction = this.initialAction;
    console.log('PostCallModal: selectedAction set to', this.selectedAction);

    // Initialize the form with existing call data if available
    if (this.call) {
      this.postCallForm.patchValue({
        notes: this.call.notes || '',
        scheduledAt: new Date().toISOString().slice(0, 16) // Default to current time
      });
      console.log('PostCallModal: Form initialized with call data');
    }
  }

  initForm(): void {
    this.postCallForm = this.formBuilder.group({
      notes: [''],
      scheduledAt: [new Date().toISOString().slice(0, 16)] // Default to current date/time
    });
  }

  close(): void {
    console.log('PostCallModal: close method called');
    this.isOpen = false;
    console.log('PostCallModal: isOpen set to false');
    this.closed.emit();
    console.log('PostCallModal: closed event emitted');
  }

  private focusNotesField(): void {
    if (this.notesField && this.notesField.nativeElement) {
      this.notesField.nativeElement.focus();
    }
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