// src/app/core/models/opportunity-history.model.ts
export interface OpportunityHistory {
  id: string;
  opportunityId: string;
  field: string; // 'status', 'stage', 'amount', etc.
  oldValue: string;
  newValue: string;
  changedBy?: string;
  changedAt: string | Date;
}
