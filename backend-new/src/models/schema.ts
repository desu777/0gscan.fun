export interface Wallet {
  address: string;
  total_0g_received?: number;
  total_w0g_received?: string;
  phase1_amount?: string;
  phase2_amount?: number;
  transaction_count: number;
  first_transaction?: number;
  last_transaction?: number;
  is_suspicious: boolean;
  suspicious_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id?: number;
  tx_hash: string;
  block_number: number;
  from_address: string;
  to_address: string;
  value: string;
  token_amount: string;
  token_type: 'W0G' | '0G';
  phase: 1 | 2;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  gas_used?: string;
  created_at: string;
}

export interface ScanProgress {
  id: number;
  contract_address: string;
  last_block_scanned: number;
  total_transactions: number;
  total_wallets: number;
  is_scanning: boolean;
  last_update: string;
}

export interface Stats {
  total_wallets: number;
  phase1_wallets: number;
  phase2_wallets: number;
  total_w0g_distributed: string;
  total_0g_distributed: string;
  overlapping_wallets: number;
  last_block_scanned: number;
  last_update: string;
}