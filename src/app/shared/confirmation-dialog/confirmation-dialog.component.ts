import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html'
})
export class ConfirmationDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmButtonText: string = 'Confirm';
  @Input() cancelButtonText: string = 'Cancel';
  @Input() confirmButtonClass: string = 'bg-stone-800 hover:bg-stone-700';
  
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  confirm(): void {
    this.confirmed.emit(true);
    this.close();
  }

  cancel(): void {
    this.confirmed.emit(false);
    this.close();
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }
}
