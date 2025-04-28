// src/app/core/models/customer-journey.model.ts
export interface CustomerTouchpoint {
  id: string;
  customerId: string;
  companyId?: string;
  type: 'email' | 'call' | 'meeting' | 'quote' | 'order' | 'website' | 'other';
  subtype?: string; // e.g., 'marketing_email', 'sales_call', etc.
  channel: 'phone' | 'email' | 'in_person' | 'web' | 'social' | 'other';
  sourceId?: string; // ID of the source record (call ID, email ID, etc.)
  sourceType?: string; // Type of the source record ('calls', 'emails', etc.)
  timestamp: string;
  description?: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  notes?: string;
  metadata?: any; // Additional data specific to the touchpoint type
  createdAt?: string;
  updatedAt?: string;
}

export interface JourneyStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  averageDuration?: number; // Average time spent in this stage (days)
  conversionRate?: number; // Percentage of customers who move to the next stage
  touchpoints?: CustomerTouchpoint[];
}

export interface CustomerJourney {
  id: string;
  customerId: string;
  customerName?: string;
  companyId?: string;
  companyName?: string;
  currentStage: string;
  stages: JourneyStage[];
  startDate: string;
  lastUpdated: string;
  isActive: boolean;
  totalTouchpoints: number;
  journeyScore?: number; // Overall score/health of the journey
  bottlenecks?: string[]; // Identified bottlenecks in the journey
}

export interface JourneyAnalytics {
  totalJourneys: number;
  activeJourneys: number;
  averageJourneyDuration: number; // In days
  conversionRates: {
    stageName: string;
    rate: number;
  }[];
  dropOffPoints: {
    stageName: string;
    dropOffRate: number;
  }[];
  channelEffectiveness: {
    channel: string;
    effectiveness: number; // Score from 0-100
  }[];
}
