import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Opportunity } from '../../../core/models/company.model';

@Component({
  selector: 'app-opportunity-details-modal',
  standalone: true,
  imports: [CommonModule],
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