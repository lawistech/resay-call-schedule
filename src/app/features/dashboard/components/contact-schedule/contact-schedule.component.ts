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
  
  constructor() {}

  ngOnInit(): void {}

  // Get only upcoming scheduled contacts, limited by maxContacts
  get scheduledContacts(): Contact[] {
    return this.contacts
      .filter(contact => contact.schedule)
      .sort((a, b) => new Date(a.schedule!).getTime() - new Date(b.schedule!).getTime())
      .slice(0, this.maxContacts);
  }

  formatTime(date: string): string {
    return format(new Date(date), 'h:mm a');
  }

  formatDate(date: string): string {
    const today = new Date();
    const contactDate = new Date(date);
    
    // Today
    if (contactDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (contactDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // This week
    return format(contactDate, 'EEEE'); // Day name (Monday, Tuesday, etc.)
  }

  onViewContact(contactId: string): void {
    this.viewContact.emit(contactId);
  }

  onScheduleCall(contact: Contact): void {
    this.scheduleCall.emit(contact);
  }
}