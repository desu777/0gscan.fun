import { Router, Request, Response } from 'express';
import { dbService } from '../services/database';
import { blockchainService } from '../services/blockchain';
import { scanner } from '../services/scanner';
import { CONTRACTS } from '../config/blockchain';

const router = Router();

router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = dbService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/wallets', (req: Request, res: Response) => {
  try {
    const { limit = '100', offset = '0', search } = req.query;
    const wallets = dbService.getWallets(
      parseInt(limit as string),
      parseInt(offset as string),
      search as string
    );

    const stats = dbService.getStats();

    res.json({
      wallets,
      total: stats.total_wallets,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Wallets error:', error);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

router.get('/wallet/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const wallet = dbService.getWallet(address);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const transactions = dbService.getWalletTransactions(address);
    const hasClaimed = await blockchainService.hasClaimed(address);

    res.json({
      ...wallet,
      transactions,
      hasClaimed,
      explorerUrl: `https://chainscan.0g.ai/address/${address}`
    });
  } catch (error) {
    console.error('Wallet detail error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet details' });
  }
});

router.get('/transactions', (req: Request, res: Response) => {
  try {
    const { limit = '100' } = req.query;
    const transactions = dbService.getRecentTransactions(parseInt(limit as string));
    res.json(transactions);
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/top-wallets', (req: Request, res: Response) => {
  try {
    const { limit = '100' } = req.query;
    const wallets = dbService.getTopWallets(parseInt(limit as string));
    res.json(wallets);
  } catch (error) {
    console.error('Top wallets error:', error);
    res.status(500).json({ error: 'Failed to fetch top wallets' });
  }
});

router.get('/search', (req: Request, res: Response) => {
  try {
    const { q, limit = '20' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = dbService.searchWallets(q as string, parseInt(limit as string));
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search wallets' });
  }
});

router.get('/export/csv', (req: Request, res: Response) => {
  try {
    const wallets = dbService.getWallets(100000, 0);

    const csv = [
      'Address,Phase1_W0G,Phase2_0G,Total_Transactions,Is_Suspicious,Suspicious_Reason',
      ...wallets.map(w =>
        `${w.address},${w.phase1_amount},${w.phase2_amount},${w.transaction_count},${w.is_suspicious},${w.suspicious_reason || ''}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=0g_airdrop_data.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

router.get('/scanner/status', async (req: Request, res: Response) => {
  try {
    const status = await scanner.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Scanner status error:', error);
    res.status(500).json({ error: 'Failed to fetch scanner status' });
  }
});

router.post('/scanner/run', async (req: Request, res: Response) => {
  try {
    const { fromBlock } = req.body;

    res.json({
      message: 'Scanner started in background',
      success: true,
      info: 'Check /api/scanner/status for progress'
    });

    scanner.runScan(fromBlock ? BigInt(fromBlock) : undefined).then(result => {
      console.log('Scanner completed:', result);
    }).catch(error => {
      console.error('Scanner error:', error);
    });

  } catch (error) {
    console.error('Scanner run error:', error);
    res.status(500).json({ error: 'Failed to run scanner' });
  }
});

router.get('/scanner/last-run', (req: Request, res: Response) => {
  try {
    const progress = dbService.getScanProgress(CONTRACTS.AIRDROP.toLowerCase());
    res.json({
      lastBlockScanned: progress?.last_block_scanned || 0,
      lastUpdate: progress?.last_update || null,
      totalTransactions: progress?.total_transactions || 0,
      isScanning: progress?.is_scanning || false
    });
  } catch (error) {
    console.error('Last run error:', error);
    res.status(500).json({ error: 'Failed to fetch last run info' });
  }
});

router.get('/methodology', (req: Request, res: Response) => {
  res.json({
    phase1: {
      method: 'W0G Token Transfer Event Analysis',
      token: CONTRACTS.W0G_TOKEN,
      airdropContract: CONTRACTS.AIRDROP,
      description: 'Tracking all W0G token transfers from the airdrop contract'
    },
    phase2: {
      method: 'Direct Wallet Transaction Scan',
      wallet: CONTRACTS.AIRDROP_WALLET,
      description: 'Scanning all outgoing transactions from the official airdrop wallet'
    },
    verification: {
      explorer: 'https://chainscan.0g.ai',
      network: '0G Mainnet (Chain ID: 16661)',
      rpc: 'https://evmrpc.0g.ai'
    }
  });
});

export default router;