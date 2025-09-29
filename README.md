# 0G Airdrop Transparency Report

Independent on-chain verification of 0G Labs token distribution. This project exposes the reality behind their airdrop promises.

## The Fraud Exposed

**Promised at TGE:** 26,000,000 0G (2.6% of total supply)
**Actually Delivered:** 6,590,871 0G (0.659% of total supply)
**Missing:** 19,409,129 0G (74.65% not delivered)

They delivered only **25.35%** of what they promised at TGE.

## Project Structure

```
0g-transparency/
├── backend/           # Express API server
├── frontend/          # React + Vite frontend
├── phase1.db          # Community airdrop data (4,542 wallets)
├── phase2.db          # Node operators data (16,881 wallets)
└── README.md
```

## Data Sources

### Phase 1 - Community Airdrop
- **Method:** Event log analysis from W0G token contract
- **W0G Token:** 0x1cd0690ff9a693f5ef2dd976660a8dafc81a109c
- **Airdrop Contract:** 0x6A9c6b5507E322Aa00eb9c45e80c07AB63acabB6
- **Results:** 4,542 wallets, 5,520,683 W0G distributed
- **Test Wallet Excluded:** 0x2af0...e42a (3.17M W0G)

### Phase 2 - Node Operators
- **Method:** Full wallet transaction history scan
- **Wallet:** 0xB03e8e11730228c2d03270bCD1Ab57818D7B6D8c
- **Block Range:** 0 to 6,892,682
- **Results:** 16,881 transactions, 1,070,188 0G distributed

### Scan Information
- **Date:** September 29, 2025 10:36 UTC
- **Contract Status:** Still ACTIVE (Day 5 since TGE)
- **Total Recipients:** 21,234 unique wallets
- **Overlapping Recipients:** 189 wallets received both phases

## Quick Start

### 1. Backend (Port 3001)

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

### 3. Access the transparency report

Open http://localhost:5173 in your browser.

## Features

- **Real-time Data:** Direct access to both phase databases
- **Interactive Tables:** Search and filter 21,234 recipients
- **Export Functionality:** Download complete CSV dataset
- **Blockchain Verification:** Direct links to block explorer
- **Responsive Design:** Works on all devices
- **PixelBlast Background:** Interactive animated background

## API Endpoints

- `GET /api/stats` - Main fraud statistics
- `GET /api/wallets` - Paginated wallet list with search
- `GET /api/wallet/:address` - Individual wallet details
- `GET /api/top-wallets` - Top 100 recipients
- `GET /api/export/csv` - Export all data as CSV
- `GET /api/methodology` - Scanning methodology

## Tech Stack

### Backend
- Express.js + TypeScript
- Better-SQLite3 for database access
- CORS enabled for frontend

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Chart.js for visualizations
- Three.js for PixelBlast effect
- React Query for data fetching
- Lucide React for icons

## Database Schema

### Phase 1 (phase1.db)
- `claims` - Individual wallet claims
- `transactions` - Transaction details
- `scan_progress` - Scan status

### Phase 2 (phase2.db)
- `recipients_analysis` - Recipient summaries
- `airdrop_transactions` - All node operator transactions
- `scan_metadata` - Scan information

## Verification

All data is verifiable on-chain:
- **Block Explorer:** https://chainscan.0g.ai
- **Network:** 0G Mainnet (Chain ID: 16661)
- **RPC:** https://evmrpc.0g.ai

## License

MIT License - This data belongs to the community.

## Contributing

This is an open transparency project. Contributions welcome to expose more fraud or improve the analysis.

---

**The numbers don't lie. 0G Labs promised 2.6% at TGE and delivered only 0.659%.**