// src/app/features/dashboard/components/lead-source-calls/lead-source-calls.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Call } from '../../../../core/models/call.model';
import { format } from 'date-fns';

@Component({
  selector: 'app-lead-source-calls',
  templateUrl: './lead-source-calls.component.html'
})
export class LeadSourceCallsComponent implements OnInit {
  @Input() calls: Call[] = [];
  @Input() maxCalls: number = 5;
  @Input() leadSource: string = '';
  @Input() title: string = 'Calls';

  @Output() viewCallDetails = new EventEmitter<string>();
  @Output() initiateCall = new EventEmitter<Call>();
  @Output() initiateSumUpCall = new EventEmitter<Call>();
  @Output() rescheduleCall = new EventEmitter<Call>();
  @Output() completeCall = new EventEmitter<string>();
  @Output() addNote = new EventEmitter<{callId: string, note: string}>();

  // Track which call has its notes editor open
  activeNotesCallId: string | null = null;
  noteText: string = '';

  constructor() {}

  ngOnInit(): void {
    // Log the number of filtered calls for debugging
    console.log(`Lead source ${this.leadSource} has ${this.filteredCalls.length} calls`);
  }

  // Get filtered calls by lead source, limited by maxCalls
  get filteredCalls(): Call[] {
    let filtered = this.calls;

    // Filter by lead source if specified
    if (this.leadSource) {
      filtered = filtered.filter(call => call.lead_source === this.leadSource);
    }

    return filtered.slice(0, this.maxCalls);
  }

  formatTime(date: string): string {
    return format(new Date(date), 'h:mm a');
  }

  onViewCallDetails(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.viewCallDetails.emit(callId);
  }

  onInitiateCall(call: Call, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // For SumUp leads, use the special SumUp call handler
    if (this.isSumUpLeadSource()) {
      this.initiateSumUpCall.emit(call);
    } else {
      this.initiateCall.emit(call);
    }
  }

  onRescheduleCall(call: Call, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.rescheduleCall.emit(call);
  }

  onCompleteCall(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.completeCall.emit(callId);
  }

  /**
   * Toggle the notes editor for a specific call
   */
  toggleNotesEditor(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.activeNotesCallId === callId) {
      this.activeNotesCallId = null;
      this.noteText = '';
    } else {
      this.activeNotesCallId = callId;
      // Pre-populate with existing notes if available
      const call = this.calls.find(c => c.id === callId);
      this.noteText = call?.notes || '';
    }
  }

  /**
   * Save notes for a call
   */
  saveNotes(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.noteText.trim()) {
      this.addNote.emit({ callId, note: this.noteText });
    }

    this.activeNotesCallId = null;
    this.noteText = '';
  }

  /**
   * Get the count of calls for this lead source
   */
  getCallCount(): number {
    return this.filteredCalls.length;
  }

  /**
   * Check if this is a SumUp lead source
   */
  isSumUpLeadSource(): boolean {
    return this.leadSource === 'sumup';
  }

  /**
   * Method to get full lead source name for better clarity
   */
  getLeadSourceFullName(leadSource: string): string {
    switch (leadSource) {
      case 'resay':
        return 'Resay Platform';
      case 'barcodesforbusiness':
        return 'Barcodes for Business';
      case 'androidepos':
        return 'Android EPOS';
      case 'sumup':
        return 'SumUp Payment System';
      default:
        return leadSource;
    }
  }
}
