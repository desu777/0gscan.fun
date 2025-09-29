# 0G Airdrop Distribution Tracker

Independent on-chain verification and monitoring platform for 0G Labs token distribution.

## Overview

This application provides transparent, real-time tracking of the 0G token airdrop distribution. All data is sourced directly from the blockchain and can be independently verified.

### What This Application Shows

- **Distribution Progress:** Real-time percentage of tokens distributed vs. announced
- **Recipient Statistics:** Complete list of all wallets that received airdrops
- **Phase Breakdown:** Separate tracking for community (W0G) and node operator distributions
- **Live Monitoring:** Automatic blockchain scanning for new claims every 5 hours
- **Verifiable Data:** Direct links to blockchain explorer for all transactions

### Distribution Status (as of September 29, 2024)

- **Announced at TGE:** 26,000,000 0G (2.6% of total supply)
- **Currently Distributed:** Dynamic calculation based on blockchain data
- **Total Recipients:** 21,234 unique wallets
- **Contract Status:** Active and monitored automatically

## Project Structure

```
0g-transparency/
├── backend-new/       # Express API server with blockchain scanner
├── frontend/          # React + Vite frontend application
├── data/              # SQLite databases with airdrop data
│   ├── phase1.db      # Community airdrop data
│   └── phase2.db      # Node operators data
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

### Data Collection Information
- **Initial Scan Date:** September 29, 2024
- **Scanner Frequency:** Every 5 hours (automated)
- **Total Recipients Tracked:** 21,234 unique wallets
- **Overlapping Recipients:** 189 wallets (received from both phases)
- **Test Wallet Excluded:** 0x2af0...e42a (3.17M W0G test transaction)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/desu777/onchain-scanner.git
cd onchain-scanner
```

2. **Start Backend (Port 3001)**
```bash
cd backend-new
npm install
npm run dev
```

3. **Start Frontend (Port 5173)**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
Open http://localhost:5173 in your browser.

### Blockchain Scanner

The scanner monitors the blockchain for new claims:
```bash
cd backend-new
npm run scanner  # Run manually
```

Or set up automated scanning every 5 hours using cron (see `backend-new/cron.example`).

## Features

- **Real-time Monitoring:** Blockchain scanner updates data every 5 hours
- **Comprehensive Database:** 21,234 unique wallet addresses tracked
- **Live Statistics:** Dynamic calculation of distribution progress
- **Blockchain Verification:** All data verifiable via 0G Chain Explorer
- **WebSocket Updates:** Real-time updates when new claims are detected
- **Export Functionality:** Download complete dataset as CSV
- **Responsive Design:** Optimized for desktop and mobile devices

## API Endpoints

### Data Retrieval
- `GET /api/stats` - Global distribution statistics
- `GET /api/wallets` - Paginated wallet list with search
- `GET /api/wallet/:address` - Individual wallet details
- `GET /api/top-wallets` - Top recipients by amount
- `GET /api/export/csv` - Export all data as CSV

### Scanner Control
- `GET /api/scanner/status` - Current scanner status
- `POST /api/scanner/run` - Manually trigger blockchain scan
- `GET /api/scanner/last-run` - Last scan information

### Information
- `GET /api/methodology` - Data collection methodology

## Tech Stack

### Backend
- **Express.js + TypeScript** - API server
- **Better-SQLite3** - High-performance database access
- **Viem** - Ethereum library for blockchain interaction
- **Socket.io** - Real-time WebSocket communication
- **Node.js 18+** - Runtime environment

### Frontend
- **React 18 + TypeScript** - UI framework
- **Vite** - Fast build tooling
- **TailwindCSS** - Utility-first CSS framework
- **OGL** - WebGL library for Galaxy background effect
- **@tanstack/react-query** - Data fetching and caching
- **Lucide React** - Icon library
- **Socket.io-client** - Real-time updates

## Database Schema

### Unified Database (airdrop.db)
- **wallets** - All recipient addresses with aggregated amounts
- **transactions** - Complete transaction history from both phases
- **scan_progress** - Blockchain scanning state and progress

### Source Databases
- **phase1.db** - Community airdrop W0G token claims (4,542 wallets)
- **phase2.db** - Node operator direct transfers (16,881 wallets)

## Verification

All data is verifiable on-chain:
- **Block Explorer:** https://chainscan.0g.ai
- **Network:** 0G Mainnet (Chain ID: 16661)
- **RPC:** https://evmrpc.0g.ai

## Environment Variables

Create `.env` file in `backend-new` directory:
```env
PORT=3001
BATCH_SIZE=10000
POLLING_INTERVAL=18000000  # 5 hours in milliseconds
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Areas for improvement:
- Additional data visualizations
- Performance optimizations
- Extended blockchain analysis
- UI/UX enhancements

## Disclaimer

This is an independent project providing transparency into blockchain data. All information is sourced directly from the 0G blockchain and can be independently verified through the block explorer.

---

**Data Transparency Initiative** - Providing verifiable on-chain data for the 0G community.