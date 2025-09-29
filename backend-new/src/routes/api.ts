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
    // Simple query - no expensive JOINs
    const wallets = dbService.getWallets(100000, 0);

    // Create header row with quotes
    const headers = [
      '"Wallet Address"',
      '"Phase 1 (0G)"',
      '"Phase 2 (0G)"',
      '"Total (0G)"',
      '"% of Total Supply"',
      '"Transaction Count"'
    ];

    // Process and format wallet data
    const TOTAL_SUPPLY = 1_000_000_000;
    const rows = wallets.map(w => {
      // Convert Phase 1 from wei to 0G
      const phase1Amount = parseFloat(w.phase1_amount || '0') / 1e18;
      const phase2Amount = w.phase2_amount || 0;
      const totalAmount = phase1Amount + phase2Amount;
      const percentOfSupply = (totalAmount / TOTAL_SUPPLY * 100).toFixed(6);

      // Format numbers with thousand separators
      const formatNumber = (num: number) => {
        return num.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      };

      return [
        `"${w.address}"`,
        formatNumber(phase1Amount),
        formatNumber(phase2Amount),
        formatNumber(totalAmount),
        `${percentOfSupply}%`,
        w.transaction_count
      ].join(',');
    });

    // Add summary row at the end
    const totalPhase1 = wallets.reduce((sum, w) =>
      sum + parseFloat(w.phase1_amount || '0') / 1e18, 0
    );
    const totalPhase2 = wallets.reduce((sum, w) =>
      sum + (w.phase2_amount || 0), 0
    );
    const grandTotal = totalPhase1 + totalPhase2;
    const totalPercent = (grandTotal / TOTAL_SUPPLY * 100).toFixed(6);

    const summaryRow = [
      '"TOTAL"',
      totalPhase1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalPhase2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${totalPercent}%`,
      wallets.length
    ].join(',');

    // Combine all parts
    const csv = [
      headers.join(','),
      ...rows,
      '', // Empty line before summary
      summaryRow
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=0g_airdrop_distribution.csv');
    res.send(BOM + csv);
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