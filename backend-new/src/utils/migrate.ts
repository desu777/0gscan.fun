import Database from 'better-sqlite3';
import path from 'path';
import { initializeDatabase } from './initDb';
import fs from 'fs';

async function migrateData() {
  console.log('🚀 Starting data migration...');

  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const newDb = initializeDatabase(path.join(dataDir, 'airdrop.db'));

  try {
    const phase1Path = path.join(__dirname, '../../../backend/phase1.db');
    const phase2Path = path.join(__dirname, '../../../backend/phase2.db');

    if (fs.existsSync(phase1Path)) {
      console.log('📁 Migrating Phase 1 data...');
      const phase1Db = new Database(phase1Path, { readonly: true });

      const claims = phase1Db.prepare('SELECT * FROM claims').all();
      const transactions = phase1Db.prepare('SELECT * FROM transactions').all();

      const insertWallet = newDb.prepare(`
        INSERT OR REPLACE INTO wallets (
          address, total_w0g_received, phase1_amount,
          transaction_count, first_transaction, last_transaction,
          is_suspicious, suspicious_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertTx = newDb.prepare(`
        INSERT OR IGNORE INTO transactions (
          tx_hash, block_number, from_address, to_address,
          value, token_amount, token_type, phase, status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, 'W0G', 1, ?, ?)
      `);

      const walletTransaction = newDb.transaction((claims: any[]) => {
        for (const claim of claims) {
          insertWallet.run(
            claim.wallet_address,
            claim.total_w0g_claimed,
            claim.total_w0g_claimed,
            claim.transaction_count,
            claim.first_claim_date,
            claim.last_claim_date,
            claim.is_suspicious || 0,
            claim.notes
          );
        }
      });
      walletTransaction(claims);

      const txTransaction = newDb.transaction((txs: any[]) => {
        for (const tx of txs) {
          insertTx.run(
            tx.tx_hash,
            tx.block_number,
            tx.from_address,
            tx.to_address,
            tx.value || '0',
            tx.w0g_amount,
            tx.status === 1 ? 'success' : 'failed',
            tx.timestamp
          );
        }
      });
      txTransaction(transactions);

      phase1Db.close();
      console.log(`✅ Migrated ${claims.length} wallets and ${transactions.length} transactions from Phase 1`);
    }

    if (fs.existsSync(phase2Path)) {
      console.log('📁 Migrating Phase 2 data...');
      const phase2Db = new Database(phase2Path, { readonly: true });

      const recipients = phase2Db.prepare('SELECT * FROM recipients_analysis').all();
      const airdrops = phase2Db.prepare('SELECT * FROM airdrop_transactions').all();

      const updateWallet = newDb.prepare(`
        INSERT INTO wallets (
          address, total_0g_received, phase2_amount,
          transaction_count, is_suspicious, suspicious_reason
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(address) DO UPDATE SET
          total_0g_received = excluded.total_0g_received,
          phase2_amount = excluded.phase2_amount,
          transaction_count = wallets.transaction_count + excluded.transaction_count,
          is_suspicious = wallets.is_suspicious OR excluded.is_suspicious,
          suspicious_reason = COALESCE(wallets.suspicious_reason, excluded.suspicious_reason),
          updated_at = CURRENT_TIMESTAMP
      `);

      const insertTx = newDb.prepare(`
        INSERT OR IGNORE INTO transactions (
          tx_hash, block_number, from_address, to_address,
          value, token_amount, token_type, phase, status, timestamp, gas_used
        ) VALUES (?, ?, ?, ?, ?, ?, '0G', 2, 'success', ?, ?)
      `);

      const walletTransaction = newDb.transaction((recipients: any[]) => {
        for (const recipient of recipients) {
          updateWallet.run(
            recipient.address,
            recipient.total_received_0g,
            recipient.total_received_0g,
            recipient.tx_count,
            recipient.is_suspicious,
            recipient.suspicious_reason
          );
        }
      });
      walletTransaction(recipients);

      const txTransaction = newDb.transaction((txs: any[]) => {
        for (const tx of txs) {
          insertTx.run(
            tx.tx_hash,
            tx.block_number,
            tx.from_address,
            tx.to_address,
            tx.value,
            tx.value,
            tx.timestamp,
            tx.gas_used
          );
        }
      });
      txTransaction(airdrops);

      phase2Db.close();
      console.log(`✅ Migrated ${recipients.length} recipients and ${airdrops.length} transactions from Phase 2`);
    }

    const stats = newDb.prepare(`
      SELECT
        COUNT(DISTINCT address) as total_wallets,
        COUNT(DISTINCT CASE WHEN phase1_amount != '0' THEN address END) as phase1_wallets,
        COUNT(DISTINCT CASE WHEN phase2_amount > 0 THEN address END) as phase2_wallets,
        COUNT(DISTINCT CASE WHEN phase1_amount != '0' AND phase2_amount > 0 THEN address END) as overlapping
      FROM wallets
    `).get();

    console.log('\n📊 Migration Summary:');
    console.log(`Total unique wallets: ${stats.total_wallets}`);
    console.log(`Phase 1 wallets: ${stats.phase1_wallets}`);
    console.log(`Phase 2 wallets: ${stats.phase2_wallets}`);
    console.log(`Overlapping wallets: ${stats.overlapping}`);

    newDb.close();
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();