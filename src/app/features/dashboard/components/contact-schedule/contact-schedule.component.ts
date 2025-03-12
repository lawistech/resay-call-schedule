// src/app/features/dashboard/components/contact-schedule/contact-schedule.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { format } from 'date-fns';

@Component({
  selector: 'app-contact-schedule',
  templateUrl: './contact-schedule.component.html'
})

export class ContactScheduleComponent implements OnInit {
  @Input() contacts: Contact[] = [];
  @Input() maxContacts: number = 5;
  @Output() viewContact = new EventEmitter<string>();
  @Output() scheduleCall = new EventEmitter<Contact>();
  
  // Add this property for the date
  today: Date = new Date();
  
  constructor() {}

  ngOnInit(): void {}

  // Update the getter to filter for today's meetings only
  get scheduledContacts(): Contact[] {
    const todayStr = this.today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    return this.contacts
      .filter(contact => contact.schedule && contact.schedule.startsWith(todayStr))
      .sort((a, b) => new Date(a.schedule!).getTime() - new Date(b.schedule!).getTime())
      .slice(0, this.maxContacts);
  }

  // Rest of the component remains the same
  formatTime(date: string): string {
    return format(new Date(date), 'h:mm a');
  }

  formatDate(date: string): string {
    // You can simplify this since we're only showing today's meetings
    return 'Today';
  }

  onViewContact(contactId: string): void {
    this.viewContact.emit(contactId);
  }

  onScheduleCall(contact: Contact): void {
    this.scheduleCall.emit(contact);
  }
}