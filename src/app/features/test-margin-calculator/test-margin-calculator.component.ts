// src/app/features/test-margin-calculator/test-margin-calculator.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StandaloneMarginCalculatorComponent } from '../../shared/components/standalone-margin-calculator/standalone-margin-calculator.component';

@Component({
  selector: 'app-test-margin-calculator',
  standalone: true,
  imports: [CommonModule, StandaloneMarginCalculatorComponent],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Test Standalone Margin Calculator</h1>
      <p class="mb-4 text-gray-600">This page demonstrates the fixed standalone margin calculator with proper close functionality.</p>
      
      <div class="flex space-x-4 mb-6">
        <button 
          (click)="showCalculator()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
          Show Calculator
        </button>
        <button 
          (click)="hideCalculator()"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200">
          Hide Calculator
        </button>
      </div>

      <div class="bg-gray-100 p-4 rounded-lg">
        <h3 class="font-semibold mb-2">Test Instructions:</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Click "Show Calculator" to display the margin calculator panel</li>
          <li>Use the X button in the top-right corner to close the panel</li>
          <li>Press ESC key to close the panel</li>
          <li>Click on the background overlay to close the panel</li>
          <li>The panel should slide in from the right with smooth animations</li>
        </ul>
      </div>
    </div>

    <!-- Standalone Margin Calculator -->
    <app-standalone-margin-calculator
      [isVisible]="isCalculatorVisible"
      (closePanel)="onCloseCalculator()">
    </app-standalone-margin-calculator>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f9fafb;
    }
  `]
})
export class TestMarginCalculatorComponent {
  isCalculatorVisible = false;

  showCalculator(): void {
    this.isCalculatorVisible = true;
  }

  hideCalculator(): void {
    this.isCalculatorVisible = false;
  }

  onCloseCalculator(): void {
    this.isCalculatorVisible = false;
  }
}
