import { Server } from 'socket.io';
import { formatUnits, decodeEventLog } from 'viem';
import { blockchainService } from './blockchain';
import { dbService } from './database';
import { CONTRACTS, ERC20_ABI } from '../config/blockchain';
import dotenv from 'dotenv';

dotenv.config();

export class AirdropIndexer {
  private io: Server | null = null;
  private isIndexing = false;
  private intervalId: NodeJS.Timeout | null = null;
  private BATCH_SIZE = 100n;
  private POLLING_INTERVAL = 12000;

  setSocketIO(io: Server) {
    this.io = io;
  }

  private emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  async startIndexing() {
    if (this.isIndexing) {
      console.log('⚠️ Indexer already running');
      return;
    }

    this.isIndexing = true;
    console.log('🚀 Starting airdrop indexer...');

    await this.indexOnce();

    this.intervalId = setInterval(async () => {
      await this.indexOnce();
    }, this.POLLING_INTERVAL);
  }

  async stopIndexing() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isIndexing = false;
    console.log('🛑 Indexer stopped');
  }

  private async indexOnce() {
    try {
      const currentBlock = await blockchainService.getCurrentBlock();

      await this.scanW0GClaims(currentBlock);
      await this.scanAirdropTransfers(currentBlock);

    } catch (error) {
      console.error('❌ Indexing error:', error);
    }
  }

  private async scanW0GClaims(currentBlock: bigint) {
    const progress = dbService.getScanProgress(CONTRACTS.AIRDROP.toLowerCase());
    const lastScanned = BigInt(progress?.last_block_scanned || 0);

    if (lastScanned >= currentBlock) {
      return;
    }

    const fromBlock = lastScanned + 1n;
    const toBlock = fromBlock + this.BATCH_SIZE > currentBlock ? currentBlock : fromBlock + this.BATCH_SIZE;

    console.log(`📊 Scanning W0G claims: blocks ${fromBlock} to ${toBlock}`);

    const w0gTransfers = await blockchainService.getW0GTransferEvents(fromBlock, toBlock);
    const airdropTxs = await blockchainService.getTransactionsToContract(CONTRACTS.AIRDROP, fromBlock, toBlock);

    let newClaims = 0;

    for (const transfer of w0gTransfers) {
      // Skip if no transaction hash or block number
      if (!transfer.transactionHash || !transfer.blockNumber) continue;

      // Decode the Transfer event
      const decoded = decodeEventLog({
        abi: ERC20_ABI,
        data: transfer.data,
        topics: transfer.topics
      }) as { eventName: string; args: { from: string; to: string; value: bigint } };

      const args = decoded.args;

      const relatedTx = airdropTxs.find(tx => tx.hash === transfer.transactionHash);
      if (!relatedTx) continue;

      if (args.from?.toLowerCase() === CONTRACTS.AIRDROP.toLowerCase() ||
          args.from?.toLowerCase() === CONTRACTS.ADMIN_WALLET.toLowerCase()) {

        const block = await blockchainService.getBlock(transfer.blockNumber);

        dbService.addTransaction({
          tx_hash: transfer.transactionHash,
          block_number: Number(transfer.blockNumber),
          from_address: args.from,
          to_address: args.to,
          value: '0',
          token_amount: args.value.toString(),
          token_type: 'W0G',
          phase: 1,
          status: 'success',
          timestamp: Number(block.timestamp)
        });

        dbService.updateWallet(args.to, args.value.toString(), 'W0G');

        newClaims++;

        this.emit('new-claim', {
          type: 'W0G',
          txHash: transfer.transactionHash,
          recipient: args.to,
          amount: formatUnits(args.value, 18),
          block: Number(transfer.blockNumber),
          timestamp: new Date().toISOString()
        });

        console.log(`✅ W0G claim: ${args.to} received ${formatUnits(args.value, 18)} W0G`);
      }
    }

    dbService.updateScanProgress(CONTRACTS.AIRDROP.toLowerCase(), Number(toBlock));

    if (newClaims > 0) {
      console.log(`Found ${newClaims} new W0G claims`);
      this.emit('stats-update', dbService.getStats());
    }
  }

  private async scanAirdropTransfers(currentBlock: bigint) {
    const progress = dbService.getScanProgress(CONTRACTS.AIRDROP_WALLET.toLowerCase());
    const lastScanned = BigInt(progress?.last_block_scanned || 0);

    if (lastScanned >= currentBlock) {
      return;
    }

    const fromBlock = lastScanned + 1n;
    const toBlock = fromBlock + this.BATCH_SIZE > currentBlock ? currentBlock : fromBlock + this.BATCH_SIZE;

    console.log(`📊 Scanning 0G transfers: blocks ${fromBlock} to ${toBlock}`);

    const blocks: any[] = [];
    for (let b = fromBlock; b <= toBlock; b++) {
      blocks.push(await blockchainService.getBlock(b));
    }

    let newTransfers = 0;

    for (const block of blocks) {
      const airdropTxs = block.transactions.filter(
        (tx: any) => tx.from?.toLowerCase() === CONTRACTS.AIRDROP_WALLET.toLowerCase()
      );

      for (const tx of airdropTxs) {
        if (!tx.to || tx.value === 0n) continue;

        dbService.addTransaction({
          tx_hash: tx.hash,
          block_number: Number(block.number),
          from_address: tx.from,
          to_address: tx.to,
          value: tx.value.toString(),
          token_amount: tx.value.toString(),
          token_type: '0G',
          phase: 2,
          status: 'success',
          timestamp: Number(block.timestamp),
          gas_used: tx.gas?.toString()
        });

        dbService.updateWallet(tx.to, formatUnits(tx.value, 18), '0G');

        newTransfers++;

        this.emit('new-transfer', {
          type: '0G',
          txHash: tx.hash,
          recipient: tx.to,
          amount: formatUnits(tx.value, 18),
          block: Number(block.number),
          timestamp: new Date().toISOString()
        });

        console.log(`✅ 0G transfer: ${tx.to} received ${formatUnits(tx.value, 18)} 0G`);
      }
    }

    dbService.updateScanProgress(CONTRACTS.AIRDROP_WALLET.toLowerCase(), Number(toBlock));

    if (newTransfers > 0) {
      console.log(`Found ${newTransfers} new 0G transfers`);
      this.emit('stats-update', dbService.getStats());
    }
  }

  async getIndexingStatus() {
    const airdropProgress = dbService.getScanProgress(CONTRACTS.AIRDROP.toLowerCase());
    const walletProgress = dbService.getScanProgress(CONTRACTS.AIRDROP_WALLET.toLowerCase());
    const currentBlock = await blockchainService.getCurrentBlock();

    return {
      isIndexing: this.isIndexing,
      currentBlock: Number(currentBlock),
      airdropContract: {
        address: CONTRACTS.AIRDROP,
        lastBlock: airdropProgress?.last_block_scanned || 0,
        totalTransactions: airdropProgress?.total_transactions || 0,
        progress: airdropProgress ?
          ((airdropProgress.last_block_scanned / Number(currentBlock)) * 100).toFixed(2) : '0'
      },
      airdropWallet: {
        address: CONTRACTS.AIRDROP_WALLET,
        lastBlock: walletProgress?.last_block_scanned || 0,
        totalTransactions: walletProgress?.total_transactions || 0,
        progress: walletProgress ?
          ((walletProgress.last_block_scanned / Number(currentBlock)) * 100).toFixed(2) : '0'
      }
    };
  }
}

export const indexer = new AirdropIndexer();

if (require.main === module) {
  console.log('Starting standalone indexer...');
  indexer.startIndexing();

  process.on('SIGINT', async () => {
    console.log('\nShutting down indexer...');
    await indexer.stopIndexing();
    process.exit(0);
  });
}