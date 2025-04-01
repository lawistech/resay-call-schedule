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
  expectedCloseDate: string | Date; // Changed from Date to string | Date to handle both
  amount: number;
  companyId: string;
  stage: string;
  value: number;
  closeDate: string | Date; // Changed from Date to string | Date
  notes?: string;
  createdAt: string | Date; // Changed from Date to string | Date
  updatedAt: string | Date; // Changed from Date to string | Date
}