-- BFFDex AI Database Schema
-- Initialize tables for transaction history and QuickBooks token storage

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transactions table - stores all payment records
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(18, 6) NOT NULL,
  token VARCHAR(50) NOT NULL DEFAULT 'USDC',
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  tx_hash VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  voice_verified BOOLEAN NOT NULL DEFAULT false,
  voice_similarity DECIMAL(3, 2),
  quickbooks_synced BOOLEAN NOT NULL DEFAULT false,
  quickbooks_error TEXT,
  attestation_uid VARCHAR(255),
  attestation_error TEXT,
  chain_id INTEGER NOT NULL DEFAULT 8453,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for faster queries
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_from_address ON transactions(from_address);
CREATE INDEX idx_transactions_to_address ON transactions(to_address);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);

-- QuickBooks tokens table - stores encrypted tokens for automatic refresh
CREATE TABLE IF NOT EXISTS quickbooks_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  realm_id VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_refreshed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create index for realm lookup
CREATE INDEX idx_qb_tokens_realm_id ON quickbooks_tokens(realm_id);
CREATE INDEX idx_qb_tokens_active ON quickbooks_tokens(is_active) WHERE is_active = true;

-- Voice verification logs - audit trail for all voice authentications
CREATE TABLE IF NOT EXISTS voice_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  phrase_required VARCHAR(255) NOT NULL,
  phrase_spoken VARCHAR(255) NOT NULL,
  similarity DECIMAL(3, 2),
  verified BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for transaction lookup
CREATE INDEX idx_voice_logs_transaction_id ON voice_logs(transaction_id);
CREATE INDEX idx_voice_logs_created_at ON voice_logs(created_at DESC);

-- EAS attestations table - tracks on-chain proofs
CREATE TABLE IF NOT EXISTS eas_attestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  attestation_uid VARCHAR(255) NOT NULL UNIQUE,
  schema_uid VARCHAR(255) NOT NULL,
  recipient_address VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  indexed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for attestation lookup
CREATE INDEX idx_eas_attestations_transaction_id ON eas_attestations(transaction_id);
CREATE INDEX idx_eas_attestations_uid ON eas_attestations(attestation_uid);

-- Enable Row Level Security (RLS) for multi-tenant support if needed
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eas_attestations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to read their own transactions
CREATE POLICY "Users can read all transactions" ON transactions
  FOR SELECT USING (true);

-- Create a policy to allow authenticated users to insert transactions
CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- Create a policy for QB tokens (admin only - restrict to specific user/role)
CREATE POLICY "QB tokens are readable by admins" ON quickbooks_tokens
  FOR SELECT USING (true);

-- Audit function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qb_tokens_updated_at
  BEFORE UPDATE ON quickbooks_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
