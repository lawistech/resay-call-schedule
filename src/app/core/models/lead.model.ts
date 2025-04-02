export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company_id?: string;
    company_name?: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
    lead_source: string;
    notes?: string;
    assigned_to?: string;
    value?: number;
    probability?: number;
    expected_close_date?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
  }