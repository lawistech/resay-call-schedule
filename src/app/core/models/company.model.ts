export interface Company {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  industry?: string;
  address?: string;
  notes?: string;
  metrics?: {
    totalOrderValue?: number;
    activeQuotations?: number;
    contactCount?: number;
    lastContactDate?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CompanyContact {
  id: string;
  companyId: string;
  contactId: string;
  role: string; // 'primary', 'technical', 'finance', 'other'
  department?: string;
  isDecisionMaker?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyCommunication {
  id: string;
  companyId: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  date: string;
  summary: string;
  contactId?: string;
  userId?: string;
  followUpDate?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductInterest {
  id: string;
  companyId: string;
  productId: string;
  lastViewed: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  status: 'New' | 'In Progress' | 'Won' | 'Lost';
  probability?: number;
  expectedCloseDate: string | Date; // Can handle both string and Date
  amount?: number;
  companyId: string;
  stage?: string;
  value: number;
  closeDate?: string | Date;
  notes?: string;
  products?: OpportunityProduct[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface OpportunityProduct {
  id?: string;
  opportunityId?: string;
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}