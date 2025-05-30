// src/app/shared/components/global-margin-panel/global-margin-panel.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarginCalculatorModalComponent } from '../margin-calculator-modal/margin-calculator-modal.component';
import { MarginPanelService } from '../../../core/services/margin-panel.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-global-margin-panel',
  standalone: true,
  imports: [CommonModule, MarginCalculatorModalComponent],
  template: `
    <app-margin-calculator-modal
      (closeModal)="onCloseModal()">
    </app-margin-calculator-modal>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1000;
    }

    :host app-margin-calculator-modal {
      pointer-events: auto;
    }
  `]
})
export class GlobalMarginPanelComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();

  constructor(private marginPanelService: MarginPanelService) {}

  ngOnInit(): void {
    // No need to track isVisible locally since the component manages its own state
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onCloseModal(): void {
    this.marginPanelService.hidePanel();
  }
}
