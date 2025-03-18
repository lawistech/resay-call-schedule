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

  

  async deleteCall(id: string) {
    return this.supabaseClient
      .from('calls')
      .delete()
      .eq('id', id);
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

  async updateOverdueStatus(): Promise<void> {
    try {
      // Get all scheduled calls
      const { data, error } = await this.supabaseClient
        .from('calls')
        .select('id, scheduled_at')
        .eq('status', 'scheduled');
      
      if (error) throw error;
      
      // For each call, check if it's overdue
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Beginning of today
      
      const updates = data.map(async (call) => {
        const scheduledDate = new Date(call.scheduled_at);
        const isOverdue = scheduledDate < today;
        
        // Update the is_overdue field
        return this.supabaseClient
          .from('calls')
          .update({ is_overdue: isOverdue })
          .eq('id', call.id);
      });
      
      // Execute all updates
      await Promise.all(updates);
      
    } catch (error) {
      console.error('Failed to update overdue status:', error);
      throw error;
    }
  }

  // src/app/core/services/supabase.service.ts
  // Add this method with your other call-related methods

  async getOverdueCalls() {
    const now = new Date().toISOString();
    
    return this.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        )
      `)
      .eq('status', 'scheduled')
      .lt('scheduled_at', now) // scheduled_at less than current time
      .order('scheduled_at', { ascending: true });
  }


    // In the getCalls() method in supabase.service.ts
  async getCalls() {
    // Get current user
    const { data: { user } } = await this.supabaseClient.auth.getUser();
    
    return this.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        )
      `)
      .eq('user_id', user?.id) // Filter calls by the logged-in user's ID
      .order('scheduled_at', { ascending: false });
  }

  // Similarly, update getUpcomingCalls() method
  async getUpcomingCalls() {
    const now = new Date().toISOString();
    const { data: { user } } = await this.supabaseClient.auth.getUser();
    
    return this.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('status', 'scheduled')
      .eq('user_id', user?.id) // Filter by user ID
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });
  }


  async createCall(callData: Partial<Call>) {
    // Get current user
    const { data: { user } } = await this.supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Format the timestamp properly with timezone
    const formattedData = {
      ...callData,
      scheduled_at: callData.scheduled_at ? new Date(callData.scheduled_at).toISOString() : null,
      follow_up_date: callData.follow_up_date && callData.follow_up_date !== '' ? 
        new Date(callData.follow_up_date).toISOString() : null
    };
    
    // Always set the user_id to the current user
    const callWithUserId = {
      ...formattedData,
      user_id: user.id,
      status: 'scheduled' // Default status for new calls
    };
    
    console.log('Sending to Supabase:', callWithUserId);
    
    try {
      const { data, error } = await this.supabaseClient
        .from('calls')
        .insert(callWithUserId)
        .select(`
          *,
          contact:contacts(*)
        `);
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating call:', error);
      return { data: null, error };
    }
  }

  async updateCall(id: string, callData: Partial<Call>) {
    return this.supabaseClient
      .from('calls')
      .update(callData)
      .eq('id', id)
      .select(`
        *,
        contact:contacts(*)
      `);
  }
}