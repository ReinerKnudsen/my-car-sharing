import { supabase } from './supabase';
import { 
  Receipt, 
  ReceiptType, 
  InsertReceipt, 
  UpdateReceipt,
  InsertReceiptType,
  UpdateReceiptType,
  GroupAccount,
  GroupAccountTransaction
} from '../types';

export const receiptService = {
  // ============================================
  // BELEGE
  // ============================================
  
  // Alle Belege einer Gruppe laden
  async getByGroup(gruppeId: string): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from('receipts')
      .select(`
        *,
        fahrer:profiles(id, vorname, name),
        receipt_type:receipt_types(id, bezeichnung),
        gruppe:groups(id, bezeichnung)
      `)
      .eq('gruppe_id', gruppeId)
      .order('datum', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Alle Belege laden (für Admin)
  async getAll(): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from('receipts')
      .select(`
        *,
        fahrer:profiles(id, vorname, name),
        receipt_type:receipt_types(id, bezeichnung),
        gruppe:groups(id, bezeichnung)
      `)
      .order('datum', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Einzelnen Beleg laden
  async getById(id: string): Promise<Receipt | null> {
    const { data, error } = await supabase
      .from('receipts')
      .select(`
        *,
        fahrer:profiles(id, vorname, name),
        receipt_type:receipt_types(id, bezeichnung),
        gruppe:groups(id, bezeichnung)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Beleg erstellen
  async create(receipt: InsertReceipt): Promise<Receipt> {
    const { data, error } = await supabase
      .from('receipts')
      .insert(receipt)
      .select(`
        *,
        fahrer:profiles(id, vorname, name),
        receipt_type:receipt_types(id, bezeichnung),
        gruppe:groups(id, bezeichnung)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Beleg aktualisieren
  async update(id: string, updates: UpdateReceipt): Promise<Receipt> {
    const { data, error } = await supabase
      .from('receipts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        fahrer:profiles(id, vorname, name),
        receipt_type:receipt_types(id, bezeichnung),
        gruppe:groups(id, bezeichnung)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Beleg löschen
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============================================
  // BELEGARTEN
  // ============================================

  // Alle aktiven Belegarten laden
  async getReceiptTypes(): Promise<ReceiptType[]> {
    const { data, error } = await supabase
      .from('receipt_types')
      .select('*')
      .eq('aktiv', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  // Alle Belegarten laden (für Admin, inkl. inaktive)
  async getAllReceiptTypes(): Promise<ReceiptType[]> {
    const { data, error } = await supabase
      .from('receipt_types')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  // Belegart erstellen
  async createReceiptType(receiptType: InsertReceiptType): Promise<ReceiptType> {
    // Hole höchste sort_order
    const { data: maxOrder } = await supabase
      .from('receipt_types')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const newSortOrder = (maxOrder?.sort_order || 0) + 1;

    const { data, error } = await supabase
      .from('receipt_types')
      .insert({ ...receiptType, sort_order: newSortOrder })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Belegart aktualisieren
  async updateReceiptType(id: string, updates: UpdateReceiptType): Promise<ReceiptType> {
    const { data, error } = await supabase
      .from('receipt_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Belegart deaktivieren (nicht löschen wegen Referenzen)
  async deactivateReceiptType(id: string): Promise<void> {
    const { error } = await supabase
      .from('receipt_types')
      .update({ aktiv: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Belegart reaktivieren
  async activateReceiptType(id: string): Promise<void> {
    const { error } = await supabase
      .from('receipt_types')
      .update({ aktiv: true })
      .eq('id', id);

    if (error) throw error;
  },

  // ============================================
  // GRUPPENKONTO
  // ============================================

  // Gruppenkonto-Übersicht
  async getGroupAccount(
    groupId: string,
    startDate?: string,
    endDate?: string
  ): Promise<GroupAccount | null> {
    const { data, error } = await supabase.rpc('get_group_account', {
      p_group_id: groupId,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (error) {
      console.error('Error fetching group account:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Gruppenkonto-Transaktionen
  async getGroupAccountTransactions(
    groupId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 50
  ): Promise<GroupAccountTransaction[]> {
    const { data, error } = await supabase.rpc('get_group_account_transactions', {
      p_group_id: groupId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_limit: limit
    });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  },
};

