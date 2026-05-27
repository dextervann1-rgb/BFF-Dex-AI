export interface PaymentResult {
  success: boolean;
  sent: string;
  to_address: string | null;
  tx_hash: string;
  basescan: string;
  attestation_uid?: string;
  quickbooks_synced: boolean;
  message: string;
}

export interface VoiceVerificationResult {
  text: string;
  similarity: number;
  verified: boolean;
}

export interface QuickBooksExpense {
  id?: string;
  amount: number;
  vendor: string;
  memo: string;
  category: string;
  tx_hash: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  token: string;
  to_address: string;
  tx_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  voice_verified: boolean;
  quickbooks_synced: boolean;
  attestation_uid?: string;
  created_at: string;
}
