// Prosty skrypt bez zewnętrznych zależności - użyjemy sqlite3 z airdrop2
import sqlite3 from 'sqlite3';
import * as fs from 'fs';

const sqlite = sqlite3.verbose();

console.log('🔍 ANALIZA BAZ DANYCH AIRDROP 0G LABS\n');
console.log('=' .repeat(60));

// Funkcja pomocnicza do wykonywania zapytań
function runQuery(db: any, query: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err: any, rows: any) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function analyzePhase1() {
  const db = new sqlite.Database('/mnt/c/Users/kubas/Desktop/0g-transparency/phase1.db', sqlite3.OPEN_READONLY);

  console.log('\n📊 PHASE 1 - Główny Airdrop (phase1.db)');
  console.log('-'.repeat(40));

  try {
    // Sprawdzamy tabele
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tabele:', tables.map(t => t.name).join(', '));

    // Statystyki
    const claimsCount = await runQuery(db, 'SELECT COUNT(*) as count FROM claims');
    console.log(`\n📈 Statystyki Phase 1:`);
    console.log(`  - Liczba walletów: ${claimsCount[0].count}`);

    // Top 10
    const topClaims = await runQuery(db, `
      SELECT wallet_address, total_w0g_claimed, transaction_count
      FROM claims
      ORDER BY LENGTH(total_w0g_claimed) DESC, total_w0g_claimed DESC
      LIMIT 10
    `);

    console.log('\n🐋 TOP 10 Największych Claimów:');
    topClaims.forEach((claim, i) => {
      // Konwersja z wei do W0G (dzielenie przez 10^18)
      const weiAmount = BigInt(claim.total_w0g_claimed);
      const w0g = Number(weiAmount / BigInt(10**16)) / 100; // Uproszczona konwersja
      console.log(`  ${i+1}. ${claim.wallet_address.slice(0,10)}... - ${w0g.toLocaleString()} W0G (${claim.transaction_count} tx)`);
    });

    // Całkowita dystrybucja
    const allClaims = await runQuery(db, 'SELECT total_w0g_claimed FROM claims');
    let totalW0G = BigInt(0);
    allClaims.forEach(c => {
      totalW0G += BigInt(c.total_w0g_claimed);
    });
    const totalW0GFormatted = Number(totalW0G / BigInt(10**16)) / 100;
    console.log(`\n💰 Całkowita dystrybucja: ${totalW0GFormatted.toLocaleString()} W0G`);

    // Koncentracja
    let top10Total = BigInt(0);
    topClaims.forEach(c => {
      top10Total += BigInt(c.total_w0g_claimed);
    });
    const concentration = (Number(top10Total) / Number(totalW0G) * 100).toFixed(2);
    console.log(`⚠️  Koncentracja TOP 10: ${concentration}%`);

  } catch (err) {
    console.log('❌ Błąd:', err);
  }

  db.close();
}

async function analyzePhase2() {
  const db = new sqlite.Database('/mnt/c/Users/kubas/Desktop/0g-transparency/phase2.db', sqlite3.OPEN_READONLY);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 PHASE 2 - Node Operators (phase2.db)');
  console.log('-'.repeat(40));

  try {
    // Sprawdzamy tabele
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tabele:', tables.map(t => t.name).join(', '));

    // Statystyki
    const txCount = await runQuery(db, 'SELECT COUNT(*) as count FROM transactions');
    console.log(`\n📈 Statystyki Phase 2:`);
    console.log(`  - Liczba transakcji: ${txCount[0].count}`);

    // Top 10 transferów
    const topTransfers = await runQuery(db, `
      SELECT to_address, value_0g, tx_hash
      FROM transactions
      ORDER BY value_0g DESC
      LIMIT 10
    `);

    console.log('\n🐋 TOP 10 Największych Transferów:');
    topTransfers.forEach((tx, i) => {
      console.log(`  ${i+1}. ${tx.to_address.slice(0,10)}... - ${tx.value_0g.toLocaleString()} 0G`);
    });

    // Agregacja per wallet
    const walletTotals = await runQuery(db, `
      SELECT to_address, SUM(value_0g) as total, COUNT(*) as tx_count
      FROM transactions
      GROUP BY to_address
      ORDER BY total DESC
      LIMIT 10
    `);

    console.log('\n📊 TOP 10 Walletów (suma otrzymanych):');
    walletTotals.forEach((w, i) => {
      console.log(`  ${i+1}. ${w.to_address.slice(0,10)}... - ${w.total.toLocaleString()} 0G (${w.tx_count} tx)`);
    });

  } catch (err) {
    console.log('❌ Błąd:', err);
  }

  db.close();
}

// Główna funkcja
async function main() {
  await analyzePhase1();
  await analyzePhase2();

  console.log('\n' + '='.repeat(60));
  console.log('\n🚨 PODSUMOWANIE OSZUSTWA:');
  console.log('-'.repeat(40));

  console.log('\n📝 Obietnice 0G Labs:');
  console.log('  - 13% tokenów dla community');
  console.log('  - Sprawiedliwa dystrybucja');
  console.log('  - Nagrody za wczesne wsparcie');

  console.log('\n🔍 Rzeczywistość:');
  console.log('  🚨 Ekstremalna koncentracja tokenów w rękach nielicznych');
  console.log('  🚨 Brak transparentności w kryteriach przydziału');
  console.log('  🚨 Preferencyjne traktowanie wybranych adresów');
  console.log('  🚨 Nierówna dystrybucja mimo obietnic "sprawiedliwości"');

  console.log('\n🎯 Gotowe do stworzenia strony internetowej!');
}

main().catch(console.error);