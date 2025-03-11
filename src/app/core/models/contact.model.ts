// src/app/core/models/contact.model.ts
import { Company } from "./company.model";

export interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    job_title?: string;
    company_id?: string;
    company?: Company;
    schedule?: string;
    
    // Additional fields
    chased_date?: string;
    date_received?: string;
    times_contacted?: number;
    quote_no?: string;
    last_chase?: string;
    opportunity_name?: string;
    product_name?: string;
    quantity?: number;
    amount?: number;
    total?: number;
    notes?: string;
    assigned?: string;
    status?: string;
    is_dead?: boolean;
    key1_quoted?: boolean;
    tags?: string[];
    discount?: number;

    created_by?: string;
    created_at?: string;
    updated_at?: string;
}