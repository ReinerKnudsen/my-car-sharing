import { supabase } from './supabase';
import { Setting, GroupCosts, DriverCosts } from '../types';

export const settingsService = {
  // Get a setting by key
  async get(key: string): Promise<string | null> {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();

    if (error) {
      console.error('Error fetching setting:', error);
      return null;
    }
    return data?.value || null;
  },

  // Get cost per km
  async getKostenProKm(): Promise<number> {
    const value = await this.get('kosten_pro_km');
    return value ? parseFloat(value) : 0.3;
  },

  // Get PayPal email
  async getPayPalEmail(): Promise<string | null> {
    return await this.get('paypal_email');
  },

  // Get PayPal Client ID
  async getPayPalClientId(): Promise<string | null> {
    return await this.get('paypal_client_id');
  },

  // Update PayPal settings
  async updatePayPalSettings(email: string, clientId: string, userId: string): Promise<void> {
    await this.update('paypal_email', email, userId);
    await this.update('paypal_client_id', clientId, userId);
  },

  // Update a setting
  async update(key: string, value: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('settings')
      .update({
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('key', key);

    if (error) throw error;
  },

  // Get all settings
  async getAll(): Promise<Setting[]> {
    const { data, error } = await supabase.from('settings').select('*').order('key');

    if (error) throw error;
    return data || [];
  },

  // Get group costs
  async getGroupCosts(
    groupId: string,
    startDate?: string,
    endDate?: string
  ): Promise<GroupCosts | null> {
    const { data, error } = await supabase.rpc('get_group_costs', {
      group_id: groupId,
      start_date: startDate || null,
      end_date: endDate || null,
    });

    if (error) {
      console.error('Error fetching group costs:', error);
      return null;
    }

    // RPC returns an array, we want the first (and only) row
    return data?.[0] || null;
  },

  // Get costs by driver for a group
  async getGroupCostsByDriver(
    groupId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DriverCosts[]> {
    const { data, error } = await supabase.rpc('get_group_costs_by_driver', {
      group_id: groupId,
      start_date: startDate || null,
      end_date: endDate || null,
    });

    if (error) {
      console.error('Error fetching driver costs:', error);
      return [];
    }

    return data || [];
  },
};
