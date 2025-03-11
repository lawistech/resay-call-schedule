// src/app/features/dashboard/components/call-stats/call-stats.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CallStats } from '../../../../core/models/call-stats.model';

@Component({
  selector: 'app-call-stats',
  templateUrl: './call-stats.component.html'
})
export class CallStatsComponent implements OnInit {
  @Input() stats!: CallStats;

  constructor() {}

  ngOnInit(): void {}
}