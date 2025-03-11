// src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Contact } from '../models/contact.model';
import { Company } from '../models/company.model';
import { Call } from '../models/call.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // Contact Methods
  async getContacts() {
    return this.supabaseClient
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .order('created_at', { ascending: false });
  }

  async getContactById(id: string) {
    return this.supabaseClient
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .single();
  }

  async createContact(contactData: Partial<Contact>) {
    return this.supabaseClient
      .from('contacts')
      .insert(contactData)
      .select(`
        *,
        company:companies(*)
      `);
  }

  async updateContact(id: string, contactData: Partial<Contact>) {
    return this.supabaseClient
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .select(`
        *,
        company:companies(*)
      `);
  }

  async deleteContact(id: string) {
    return this.supabaseClient
      .from('contacts')
      .delete()
      .eq('id', id);
  }

  // Company Methods
  async getCompanies() {
    return this.supabaseClient
      .from('companies')
      .select('*')
      .order('name', { ascending: true });
  }

  async getCompanyById(id: string) {
    return this.supabaseClient
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
  }

  async createCompany(companyData: Partial<Company>) {
    return this.supabaseClient
      .from('companies')
      .insert(companyData)
      .select();
  }

  async updateCompany(id: string, companyData: Partial<Company>) {
    return this.supabaseClient
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .select();
  }

  // Call Methods
  async getCalls() {
    return this.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(*)
      `)
      .order('scheduled_at', { ascending: false });
  }

  async getCallsByDate(date: string) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    return this.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone, job_title)
      `)
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay)
      .order('scheduled_at', { ascending: true });
  }

  async createCall(callData: Partial<Call>) {
    return this.supabaseClient
      .from('calls')
      .insert(callData)
      .select(`
        *,
        contacts(*)
      `);
  }

  async updateCall(id: string, callData: Partial<Call>) {
    return this.supabaseClient
      .from('calls')
      .update(callData)
      .eq('id', id)
      .select(`
        *,
        contacts(*)
      `);
  }

  async deleteCall(id: string) {
    return this.supabaseClient
      .from('calls')
      .delete()
      .eq('id', id);
  }

  // Schedule-specific methods
  async getUpcomingCalls() {
    const now = new Date().toISOString();
    
    return this.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });
  }

  async getContactsWithScheduleForDate(date: string) {
    return this.supabaseClient
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .like('schedule', `${date}%`) // Look for schedules starting with today's date
      .order('schedule', { ascending: true });
  }
  
  async getScheduleForDateRange(startDate: string, endDate: string) {
    // Get calls in date range
    const callsPromise = this.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', `${startDate}T00:00:00`)
      .lte('scheduled_at', `${endDate}T23:59:59`)
      .order('scheduled_at', { ascending: true });
      
    // Get contacts scheduled in date range  
    const contactsPromise = this.supabaseClient
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .gte('schedule', `${startDate}`)
      .lte('schedule', `${endDate}T23:59:59`)
      .order('schedule', { ascending: true });
      
    // Execute both queries concurrently
    const [callsResponse, contactsResponse] = await Promise.all([callsPromise, contactsPromise]);
    
    return {
      calls: callsResponse.data || [],
      contacts: contactsResponse.data || [],
      callsError: callsResponse.error,
      contactsError: contactsResponse.error
    };
  }
}