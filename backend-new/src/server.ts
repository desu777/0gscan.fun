import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { scanner } from './services/scanner';
import { dbService } from './services/database';
import { initializeDatabase } from './utils/initDb';
import fs from 'fs';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

io.on('connection', (socket) => {
  console.log('👤 New client connected:', socket.id);

  socket.on('get-stats', async () => {
    const stats = dbService.getStats();
    socket.emit('stats-update', stats);
  });

  socket.on('get-recent-transactions', async () => {
    const transactions = dbService.getRecentTransactions(50);
    socket.emit('transactions-update', transactions);
  });

  socket.on('disconnect', () => {
    console.log('👤 Client disconnected:', socket.id);
  });
});

scanner.setSocketIO(io);

async function initializeServer() {
  console.log('🔧 Initializing server...');

  const dataDir = path.join(__dirname, '../data');
  const dbPath = path.join(dataDir, 'airdrop.db');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    console.log('📦 Creating database...');
    initializeDatabase(dbPath);
    console.log('⚠️  Database created. Run npm run migrate to import data.');
  } else {
    console.log('✅ Database found');
  }

  server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     0G Airdrop Transparency Backend        ║
╠════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}  ║
║  WebSocket ready for real-time updates     ║
╚════════════════════════════════════════════╝
    `);

    console.log('\n📍 API Endpoints:');
    console.log('  GET  /api/stats              - Global statistics');
    console.log('  GET  /api/wallets            - Paginated wallet list');
    console.log('  GET  /api/wallet/:address    - Individual wallet details');
    console.log('  GET  /api/transactions       - Recent transactions');
    console.log('  GET  /api/top-wallets        - Top recipients');
    console.log('  GET  /api/search             - Search wallets');
    console.log('  GET  /api/export/csv         - Export data as CSV');
    console.log('  GET  /api/scanner/status     - Scanner status');
    console.log('  POST /api/scanner/run        - Run scanner');
    console.log('  GET  /api/scanner/last-run   - Last scanner run info');
    console.log('  GET  /api/methodology        - Scanning methodology');
    console.log('\n🔌 WebSocket Events:');
    console.log('  - new-claim        : New W0G claim detected');
    console.log('  - new-transfer     : New 0G transfer detected');
    console.log('  - stats-update     : Statistics updated');
    console.log('  - transactions-update : New transactions');

    console.log('\n💡 Scanner can be run manually via:');
    console.log('  - API: POST /api/scanner/run');
    console.log('  - CLI: npm run scanner');
    console.log('  - Cron: Set up to run every 5 hours');
  });
}

process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  server.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

initializeServer().catch(console.error);