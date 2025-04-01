import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Opportunity } from '../../../core/models/company.model';

@Component({
  selector: 'app-opportunity-details-modal',
  templateUrl: './opportunity-details-modal.component.html',
  styleUrls: ['./opportunity-details-modal.component.css']
})
export class OpportunityDetailsModalComponent {
  @Input() show: boolean = false;
  @Input() opportunity: Opportunity | null = null;
  @Output() closeEvent = new EventEmitter<boolean>();

  close() {
    this.closeEvent.emit(false);
  }
}