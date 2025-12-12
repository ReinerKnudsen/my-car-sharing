import { supabase } from './supabase';
import { InvitationCode, InvitationCodeFormData } from '../types';

// Generate a random invitation code (8 characters, alphanumeric uppercase)
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const invitationService = {
  // Create a new invitation code
  async createCode(data: InvitationCodeFormData, createdBy: string): Promise<InvitationCode> {
    const code = generateCode();
    
    const { data: result, error } = await supabase
      .from('invitation_codes')
      .insert({
        code,
        gruppe_id: data.gruppe_id,
        created_by: createdBy,
        expires_at: data.expires_at || null,
        max_uses: data.max_uses || 1,
        is_active: true,
      })
      .select('*, gruppe:groups(*), creator:profiles!created_by(*)')
      .single();

    if (error) throw error;
    return result;
  },

  // Validate an invitation code (for registration)
  async validateCode(code: string): Promise<{ valid: boolean; gruppe_id?: string; error?: string }> {
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*, gruppe:groups(*)')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Ungültiger Einladungscode' };
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Dieser Einladungscode ist abgelaufen' };
    }

    // Check if max uses reached
    if (data.uses_count >= data.max_uses) {
      return { valid: false, error: 'Dieser Einladungscode wurde bereits verwendet' };
    }

    return { valid: true, gruppe_id: data.gruppe_id };
  },

  // Use an invitation code (increment uses_count via secure RPC function)
  async useCode(code: string): Promise<void> {
    const { error } = await supabase.rpc('use_invitation_code', {
      code_to_use: code.toUpperCase()
    });

    if (error) throw error;
  },

  // Get all invitation codes (for admins)
  async getAllCodes(): Promise<InvitationCode[]> {
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*, gruppe:groups(*), creator:profiles!created_by(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get invitation codes for a specific group (for group admins)
  async getCodesForGroup(gruppeId: string): Promise<InvitationCode[]> {
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*, gruppe:groups(*), creator:profiles!created_by(*)')
      .eq('gruppe_id', gruppeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Deactivate an invitation code
  async deactivateCode(codeId: string): Promise<void> {
    const { error } = await supabase
      .from('invitation_codes')
      .update({ is_active: false })
      .eq('id', codeId);

    if (error) throw error;
  },

  // Reactivate an invitation code
  async reactivateCode(codeId: string): Promise<void> {
    const { error } = await supabase
      .from('invitation_codes')
      .update({ is_active: true })
      .eq('id', codeId);

    if (error) throw error;
  },

  // Delete an invitation code
  async deleteCode(codeId: string): Promise<void> {
    const { error } = await supabase
      .from('invitation_codes')
      .delete()
      .eq('id', codeId);

    if (error) throw error;
  },
};

