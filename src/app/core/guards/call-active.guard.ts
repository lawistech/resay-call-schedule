// src/app/core/guards/call-active.guard.ts
import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { CallStateService } from '../services/call-state.service';
import { ScheduleComponent } from '../../features/schedule/schedule.component';

@Injectable({
  providedIn: 'root'
})
export class CallActiveGuard implements CanDeactivate<ScheduleComponent> {
  constructor(private callStateService: CallStateService) {}

  canDeactivate(): boolean {
    // If there's an active call showing post-call modal, don't navigate away
    if (this.callStateService.shouldShowPostCallModal()) {
      return false;
    }
    return true;
  }
}