import Database from 'better-sqlite3';
import path from 'path';

export function initializeDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  db.exec(`
    -- Wallets table with combined data from both phases
    CREATE TABLE IF NOT EXISTS wallets (
      address TEXT PRIMARY KEY,
      total_0g_received REAL DEFAULT 0,
      total_w0g_received TEXT DEFAULT '0',
      phase1_amount TEXT DEFAULT '0',
      phase2_amount REAL DEFAULT 0,
      transaction_count INTEGER DEFAULT 0,
      first_transaction INTEGER,
      last_transaction INTEGER,
      is_suspicious BOOLEAN DEFAULT 0,
      suspicious_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Transactions table for all airdrop transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_hash TEXT UNIQUE NOT NULL,
      block_number INTEGER NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      value TEXT DEFAULT '0',
      token_amount TEXT NOT NULL,
      token_type TEXT CHECK(token_type IN ('W0G', '0G')) NOT NULL,
      phase INTEGER CHECK(phase IN (1, 2)) NOT NULL,
      status TEXT DEFAULT 'success',
      timestamp INTEGER NOT NULL,
      gas_used TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Scan progress tracking
    CREATE TABLE IF NOT EXISTS scan_progress (
      id INTEGER PRIMARY KEY,
      contract_address TEXT NOT NULL,
      last_block_scanned INTEGER DEFAULT 0,
      total_transactions INTEGER DEFAULT 0,
      total_wallets INTEGER DEFAULT 0,
      is_scanning BOOLEAN DEFAULT 0,
      last_update DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Creating indexes for performance
    CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
    CREATE INDEX IF NOT EXISTS idx_wallets_phase1_amount ON wallets(phase1_amount);
    CREATE INDEX IF NOT EXISTS idx_wallets_phase2_amount ON wallets(phase2_amount);
    CREATE INDEX IF NOT EXISTS idx_wallets_suspicious ON wallets(is_suspicious);

    CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
    CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions(block_number);
    CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_transactions_phase ON transactions(phase);
    CREATE INDEX IF NOT EXISTS idx_transactions_token_type ON transactions(token_type);

    -- Initialize scan progress for both contracts
    INSERT OR IGNORE INTO scan_progress (id, contract_address, last_block_scanned)
    VALUES
      (1, '0x6a9c6b5507e322aa00eb9c45e80c07ab63acabb6', 0),
      (2, '0xb03e8e11730228c2d03270bcd1ab57818d7b6d8c', 0);
  `);

  console.log('✅ Database initialized with indexes');
  return db;
}

export function getDatabase(): Database.Database {
  const dbPath = path.join(__dirname, '../../data/airdrop.db');
  return new Database(dbPath);
}