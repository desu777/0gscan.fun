import Database from 'better-sqlite3';
import path from 'path';
import { Wallet, Transaction, Stats } from '../models/schema';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../../data/airdrop.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  getStats(): Stats {
    const stats = this.db.prepare(`
      SELECT
        COUNT(DISTINCT address) as total_wallets,
        COUNT(DISTINCT CASE WHEN phase1_amount != '0' THEN address END) as phase1_wallets,
        COUNT(DISTINCT CASE WHEN phase2_amount > 0 THEN address END) as phase2_wallets,
        SUM(CAST(phase1_amount as REAL)) as total_w0g,
        SUM(phase2_amount) as total_0g,
        COUNT(DISTINCT CASE WHEN phase1_amount != '0' AND phase2_amount > 0 THEN address END) as overlapping_wallets
      FROM wallets
    `).get() as any;

    const progress = this.db.prepare(`
      SELECT MAX(last_block_scanned) as last_block, MAX(last_update) as last_update
      FROM scan_progress
    `).get() as any;

    return {
      total_wallets: stats.total_wallets || 0,
      phase1_wallets: stats.phase1_wallets || 0,
      phase2_wallets: stats.phase2_wallets || 0,
      total_w0g_distributed: stats.total_w0g?.toString() || '0',
      total_0g_distributed: stats.total_0g?.toString() || '0',
      overlapping_wallets: stats.overlapping_wallets || 0,
      last_block_scanned: progress.last_block || 0,
      last_update: progress.last_update || new Date().toISOString()
    };
  }

  getWallets(limit: number = 100, offset: number = 0, search?: string): Wallet[] {
    let query = `SELECT * FROM wallets`;
    const params: any[] = [];

    if (search) {
      query += ` WHERE address LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY
      CAST(phase1_amount as REAL) + phase2_amount DESC,
      transaction_count DESC
      LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return this.db.prepare(query).all(...params) as Wallet[];
  }

  getWallet(address: string): Wallet | null {
    const wallet = this.db.prepare(`
      SELECT * FROM wallets WHERE LOWER(address) = LOWER(?)
    `).get(address) as Wallet;

    return wallet || null;
  }

  getWalletTransactions(address: string, limit: number = 50): Transaction[] {
    return this.db.prepare(`
      SELECT * FROM transactions
      WHERE LOWER(to_address) = LOWER(?) OR LOWER(from_address) = LOWER(?)
      ORDER BY block_number DESC
      LIMIT ?
    `).all(address, address, limit) as Transaction[];
  }

  getRecentTransactions(limit: number = 100): Transaction[] {
    return this.db.prepare(`
      SELECT * FROM transactions
      ORDER BY block_number DESC, timestamp DESC
      LIMIT ?
    `).all(limit) as Transaction[];
  }

  getTopWallets(limit: number = 100): Wallet[] {
    return this.db.prepare(`
      SELECT *,
        CAST(phase1_amount as REAL) + phase2_amount as total_amount
      FROM wallets
      ORDER BY total_amount DESC
      LIMIT ?
    `).all(limit) as Wallet[];
  }

  searchWallets(query: string, limit: number = 20): Wallet[] {
    return this.db.prepare(`
      SELECT * FROM wallets
      WHERE address LIKE ?
      LIMIT ?
    `).all(`%${query}%`, limit) as Wallet[];
  }

  addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO transactions (
        tx_hash, block_number, from_address, to_address,
        value, token_amount, token_type, phase, status, timestamp, gas_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tx.tx_hash,
      tx.block_number,
      tx.from_address,
      tx.to_address,
      tx.value,
      tx.token_amount,
      tx.token_type,
      tx.phase,
      tx.status,
      tx.timestamp,
      tx.gas_used
    );
  }

  updateWallet(address: string, amount: string, tokenType: 'W0G' | '0G'): void {
    const existing = this.getWallet(address);

    if (existing) {
      if (tokenType === 'W0G') {
        this.db.prepare(`
          UPDATE wallets SET
            phase1_amount = ?,
            total_w0g_received = ?,
            transaction_count = transaction_count + 1,
            last_transaction = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(address) = LOWER(?)
        `).run(amount, amount, Date.now(), address);
      } else {
        this.db.prepare(`
          UPDATE wallets SET
            phase2_amount = phase2_amount + ?,
            total_0g_received = total_0g_received + ?,
            transaction_count = transaction_count + 1,
            last_transaction = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(address) = LOWER(?)
        `).run(parseFloat(amount), parseFloat(amount), Date.now(), address);
      }
    } else {
      this.db.prepare(`
        INSERT INTO wallets (
          address, total_0g_received, total_w0g_received,
          phase1_amount, phase2_amount, transaction_count,
          first_transaction, last_transaction
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        address,
        tokenType === '0G' ? amount : '0',
        tokenType === 'W0G' ? amount : '0',
        tokenType === 'W0G' ? amount : '0',
        tokenType === '0G' ? parseFloat(amount) : 0,
        Date.now(),
        Date.now()
      );
    }
  }

  updateScanProgress(contractAddress: string, blockNumber: number): void {
    this.db.prepare(`
      UPDATE scan_progress SET
        last_block_scanned = ?,
        total_transactions = total_transactions + 1,
        last_update = CURRENT_TIMESTAMP
      WHERE contract_address = ?
    `).run(blockNumber, contractAddress.toLowerCase());
  }

  getScanProgress(contractAddress: string): any {
    return this.db.prepare(`
      SELECT * FROM scan_progress WHERE contract_address = ?
    `).get(contractAddress.toLowerCase());
  }

  close(): void {
    this.db.close();
  }
}

export const dbService = new DatabaseService();