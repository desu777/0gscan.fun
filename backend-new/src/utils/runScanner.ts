#!/usr/bin/env node

import { scanner } from '../services/scanner';
import { initializeDatabase } from './initDb';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runScanner() {
  const logFile = path.join(__dirname, '../../logs', `scanner-${new Date().toISOString().split('T')[0]}.log`);
  const logsDir = path.join(__dirname, '../../logs');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
  };

  log('========================================');
  log('0G AIRDROP SCANNER - SCHEDULED RUN');
  log('========================================');

  try {
    const dataDir = path.join(__dirname, '../../data');
    const dbPath = path.join(dataDir, 'airdrop.db');

    if (!fs.existsSync(dbPath)) {
      log('❌ Database not found. Please run: npm run migrate');
      process.exit(1);
    }

    log('✅ Database found');
    log('🚀 Starting scanner...');

    const result = await scanner.runScan();

    if (result.success) {
      log(`✅ Scanner completed successfully`);
      log(`📊 New claims found: ${result.totalClaims}`);
      log(`💰 Total W0G: ${result.totalW0G}`);
      log(`📦 Last block: ${result.lastBlock}`);
    } else {
      log(`❌ Scanner failed`);
    }

  } catch (error: any) {
    log(`❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  log('========================================');
  log('Scanner run completed');
  log('========================================\n');

  process.exit(0);
}

if (require.main === module) {
  runScanner().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}