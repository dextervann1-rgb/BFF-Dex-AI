import { createClient } from '@supabase/supabase-js';

// Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[BFFDex] Supabase not configured - transactions will not be persisted');
}

// Public client (for client-side operations with RLS)
export const supabasePublic = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Service role client (for server-side admin operations)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Type definitions for database tables
export interface Transaction {
  id: string;
  amount: number;
  token: string;
  from_address: string;
  to_address: string;
  tx_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  voice_verified: boolean;
  voice_similarity?: number;
  quickbooks_synced: boolean;
  quickbooks_error?: string;
  attestation_uid?: string;
  attestation_error?: string;
  chain_id: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface QuickBooksToken {
  id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  last_refreshed_at?: string;
  is_active: boolean;
}

export interface VoiceLog {
  id: string;
  transaction_id?: string;
  phrase_required: string;
  phrase_spoken: string;
  similarity?: number;
  verified: boolean;
  error_message?: string;
  created_at: string;
}

export interface EasAttestation {
  id: string;
  transaction_id?: string;
  attestation_uid: string;
  schema_uid: string;
  recipient_address: string;
  data: Record<string, any>;
  created_at: string;
  indexed_at?: string;
}

// Helper function to save a transaction
export async function saveTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabaseAdmin) {
    console.warn('[BFFDex] Supabase not configured - transaction not saved');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert([tx])
      .select()
      .single();

    if (error) {
      console.error('[BFFDex] Failed to save transaction:', error);
      return null;
    }

    return data as Transaction;
  } catch (err) {
    console.error('[BFFDex] Error saving transaction:', err);
    return null;
  }
}

// Helper function to update a transaction
export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  if (!supabaseAdmin) {
    console.warn('[BFFDex] Supabase not configured - transaction not updated');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[BFFDex] Failed to update transaction:', error);
      return null;
    }

    return data as Transaction;
  } catch (err) {
    console.error('[BFFDex] Error updating transaction:', err);
    return null;
  }
}

// Helper function to fetch transactions
export async function getTransactions(limit = 50, offset = 0) {
  if (!supabaseAdmin) {
    console.warn('[BFFDex] Supabase not configured - cannot fetch transactions');
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[BFFDex] Failed to fetch transactions:', error);
      return [];
    }

    return (data || []) as Transaction[];
  } catch (err) {
    console.error('[BFFDex] Error fetching transactions:', err);
    return [];
  }
}

// Helper function to save QB token
export async function saveQuickBooksToken(token: Omit<QuickBooksToken, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabaseAdmin) {
    console.warn('[BFFDex] Supabase not configured - QB token not saved');
    return null;
  }

  try {
    // Check if token for this realm already exists
    const { data: existing } = await supabaseAdmin
      .from('quickbooks_tokens')
      .select('id')
      .eq('realm_id', token.realm_id)
      .single();

    if (existing) {
      // Update existing token
      const { data, error } = await supabaseAdmin
        .from('quickbooks_tokens')
        .update(token)
        .eq('realm_id', token.realm_id)
        .select()
        .single();

      if (error) {
        console.error('[BFFDex] Failed to update QB token:', error);
        return null;
      }

      return data as QuickBooksToken;
    } else {
      // Insert new token
      const { data, error } = await supabaseAdmin
        .from('quickbooks_tokens')
        .insert([token])
        .select()
        .single();

      if (error) {
        console.error('[BFFDex] Failed to save QB token:', error);
        return null;
      }

      return data as QuickBooksToken;
    }
  } catch (err) {
    console.error('[BFFDex] Error saving QB token:', err);
    return null;
  }
}

// Helper function to get active QB token
export async function getActiveQuickBooksToken() {
  if (!supabaseAdmin) {
    console.warn('[BFFDex] Supabase not configured - cannot fetch QB token');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_tokens')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[BFFDex] Failed to fetch QB token:', error);
      return null;
    }

    return data as QuickBooksToken;
  } catch (err) {
    console.error('[BFFDex] Error fetching QB token:', err);
    return null;
  }
}

// Helper function to save voice log
export async function saveVoiceLog(log: Omit<VoiceLog, 'id' | 'created_at'>) {
  if (!supabaseAdmin) {
    console.warn('[BFFDex] Supabase not configured - voice log not saved');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('voice_logs')
      .insert([log])
      .select()
      .single();

    if (error) {
      console.error('[BFFDex] Failed to save voice log:', error);
      return null;
    }

    return data as VoiceLog;
  } catch (err) {
    console.error('[BFFDex] Error saving voice log:', err);
    return null;
  }
}

// Helper function to save EAS attestation
export async function saveEasAttestation(attestation: Omit<EasAttestation, 'id' | 'created_at'>) {
  if (!supabaseAdmin) {
    console.warn('[BFFDex] Supabase not configured - attestation not saved');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('eas_attestations')
      .insert([attestation])
      .select()
      .single();

    if (error) {
      console.error('[BFFDex] Failed to save attestation:', error);
      return null;
    }

    return data as EasAttestation;
  } catch (err) {
    console.error('[BFFDex] Error saving attestation:', err);
    return null;
  }
}
