import { formatUnits, parseAbiItem } from 'viem';
import { blockchainService } from './blockchain';
import { dbService } from './database';
import { CONTRACTS } from '../config/blockchain';
import { Server } from 'socket.io';

export class AirdropScanner {
  private io: Server | null = null;
  private isScanning = false;
  private BATCH_SIZE = 10000n;

  setSocketIO(io: Server) {
    this.io = io;
  }

  private emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  async runScan(fromBlock?: bigint): Promise<{
    success: boolean;
    totalClaims: number;
    totalW0G: string;
    lastBlock: number;
  }> {
    if (this.isScanning) {
      console.log('⚠️ Scan already in progress');
      return {
        success: false,
        totalClaims: 0,
        totalW0G: '0',
        lastBlock: 0
      };
    }

    this.isScanning = true;
    console.log('🚀 Starting W0G Airdrop Scanner...');
    console.log(`📅 Time: ${new Date().toISOString()}`);

    let totalW0G = 0n;
    let totalClaims = 0;
    let lastBlockScanned = 0;

    try {
      const currentBlock = await blockchainService.getCurrentBlock();
      console.log('📦 Current blockchain block:', currentBlock);

      const progress = dbService.getScanProgress(CONTRACTS.AIRDROP.toLowerCase());
      // Start from last Phase 1 transaction block (7207951) if no progress saved
      const DEFAULT_START_BLOCK = 7207951n;
      const startBlock = fromBlock || BigInt(progress?.last_block_scanned || DEFAULT_START_BLOCK);

      if (startBlock >= currentBlock) {
        console.log('✅ Already up to date');
        return {
          success: true,
          totalClaims: 0,
          totalW0G: '0',
          lastBlock: Number(currentBlock)
        };
      }

      console.log(`📍 Scanning from block ${startBlock} to ${currentBlock}`);
      console.log(`📊 Blocks to scan: ${currentBlock - startBlock}`);

      for (let block = startBlock; block <= currentBlock; block += this.BATCH_SIZE) {
        const toBlock = block + this.BATCH_SIZE - 1n > currentBlock ? currentBlock : block + this.BATCH_SIZE - 1n;

        console.log(`\n🔍 Scanning blocks ${block} to ${toBlock}...`);

        const progress = ((Number(block - startBlock) / Number(currentBlock - startBlock)) * 100).toFixed(2);
        console.log(`Progress: ${progress}%`);

        this.emit('scan-progress', {
          current: Number(block),
          total: Number(currentBlock),
          percentage: progress
        });

        try {
          const client = (blockchainService as any).client;

          const transfersToAirdrop = await client.getLogs({
            address: CONTRACTS.W0G_TOKEN as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: {
              to: CONTRACTS.AIRDROP.toLowerCase() as `0x${string}`
            },
            fromBlock: block,
            toBlock: toBlock,
          });

          console.log(`📥 Found ${transfersToAirdrop.length} W0G transfers TO airdrop contract`);

          const adminWallets = new Set<string>();

          for (const log of transfersToAirdrop) {
            const args = log.args as { from: string; to: string; value: bigint };

            if (args.value > 0n) {
              totalClaims++;
              totalW0G += args.value;

              adminWallets.add(args.from);

              const tx = await blockchainService.getTransaction(log.transactionHash);

              const claimer = tx.from;
              const block = await blockchainService.getBlock(log.blockNumber);

              dbService.addTransaction({
                tx_hash: log.transactionHash,
                block_number: Number(log.blockNumber),
                from_address: claimer.toLowerCase(),
                to_address: CONTRACTS.AIRDROP.toLowerCase(),
                value: '0',
                token_amount: args.value.toString(),
                token_type: 'W0G',
                phase: 1,
                status: 'success',
                timestamp: Number(block.timestamp),
                gas_used: tx.gas?.toString()
              });

              dbService.updateWallet(claimer, args.value.toString(), 'W0G');

              console.log(`✅ Claim: ${claimer} claimed ${formatUnits(args.value, 18)} W0G`);

              this.emit('new-claim', {
                type: 'W0G',
                txHash: log.transactionHash,
                recipient: claimer,
                amount: formatUnits(args.value, 18),
                block: Number(log.blockNumber),
                timestamp: new Date().toISOString()
              });
            }
          }

          if (adminWallets.size > 0) {
            console.log(`📋 Admin wallets found: ${Array.from(adminWallets).map(a => a.slice(0, 10)).join(', ')}`);
          }

        } catch (error: any) {
          if (error.message?.includes('rate limit') || error.message?.includes('429')) {
            console.log('⏳ Rate limited, waiting 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            block -= this.BATCH_SIZE;
            continue;
          }
          console.error(`Error fetching logs for blocks ${block}-${toBlock}:`, error.message);
        }

        dbService.updateScanProgress(CONTRACTS.AIRDROP.toLowerCase(), Number(toBlock));
        lastBlockScanned = Number(toBlock);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`\n✅ Scan complete!`);
      console.log(`📊 Total new claims found: ${totalClaims}`);
      console.log(`💰 Total W0G distributed: ${formatUnits(totalW0G, 18)}`);

      await this.generateAnalytics();

      this.emit('stats-update', dbService.getStats());

      return {
        success: true,
        totalClaims,
        totalW0G: formatUnits(totalW0G, 18),
        lastBlock: lastBlockScanned
      };

    } catch (error) {
      console.error('❌ Scan error:', error);
      return {
        success: false,
        totalClaims,
        totalW0G: formatUnits(totalW0G, 18),
        lastBlock: lastBlockScanned
      };
    } finally {
      this.isScanning = false;
    }
  }

  private async generateAnalytics() {
    console.log('\n📈 Generating analytics...');

    const stats = dbService.getStats();
    const topWallets = dbService.getTopWallets(10);

    console.log('\n🐋 Top 10 Recipients:');
    topWallets.forEach((w, i) => {
      const total = parseFloat(w.phase1_amount || '0') + (w.phase2_amount || 0);
      console.log(`${i + 1}. ${w.address}: ${total.toFixed(2)} (${w.transaction_count} txs)`);
    });

    console.log('\n📊 Distribution Stats:');
    console.log(`Total wallets: ${stats.total_wallets}`);
    console.log(`Phase 1 wallets: ${stats.phase1_wallets}`);
    console.log(`Phase 2 wallets: ${stats.phase2_wallets}`);
    console.log(`Overlapping: ${stats.overlapping_wallets}`);

    if (stats.phase1_wallets > 0) {
      const avgW0G = parseFloat(stats.total_w0g_distributed) / stats.phase1_wallets;
      console.log(`Average W0G per wallet: ${avgW0G.toFixed(2)}`);
    }

    const top10Phase1 = topWallets.slice(0, 10).reduce(
      (sum, w) => sum + parseFloat(w.phase1_amount || '0'), 0
    );

    if (parseFloat(stats.total_w0g_distributed) > 0) {
      const concentration = (top10Phase1 / parseFloat(stats.total_w0g_distributed) * 100).toFixed(2);
      console.log(`\n⚠️ Concentration: Top 10 wallets hold ${concentration}% of all W0G`);

      if (parseFloat(concentration) > 30) {
        console.log('🚨 HIGH CONCENTRATION DETECTED! Possible unfair distribution.');
      }
    }
  }

  async getStatus() {
    const progress = dbService.getScanProgress(CONTRACTS.AIRDROP.toLowerCase());
    const currentBlock = await blockchainService.getCurrentBlock();

    return {
      isScanning: this.isScanning,
      currentBlock: Number(currentBlock),
      lastScannedBlock: progress?.last_block_scanned || 0,
      blocksRemaining: Number(currentBlock) - (progress?.last_block_scanned || 0),
      totalTransactions: progress?.total_transactions || 0,
      lastUpdate: progress?.last_update || null,
      progress: progress ?
        ((progress.last_block_scanned / Number(currentBlock)) * 100).toFixed(2) : '0'
    };
  }
}

export const scanner = new AirdropScanner();

if (require.main === module) {
  console.log('🚀 Starting standalone scanner...');
  scanner.runScan().then((result) => {
    console.log('✅ Scanner finished!', result);
    process.exit(0);
  }).catch(error => {
    console.error('❌ Scanner error:', error);
    process.exit(1);
  });
}