export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  address?: string;
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
  expectedCloseDate: Date;
  amount: number;
  companyId: string;
  stage: string;
  value: number;
  closeDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
