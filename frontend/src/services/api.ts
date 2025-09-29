import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export interface Stats {
  total_wallets: number;
  phase1_wallets: number;
  phase2_wallets: number;
  total_w0g_distributed: string;
  total_0g_distributed: string;
  overlapping_wallets: number;
  last_block_scanned: number;
  last_update: string;
}

export interface Wallet {
  address: string;
  total_0g_received?: number;
  total_w0g_received?: string;
  phase1_amount?: string;
  phase2_amount?: number;
  transaction_count: number;
  first_transaction?: number;
  last_transaction?: number;
  is_suspicious: boolean;
  suspicious_reason?: string;
}

class ApiService {
  private socket: Socket | null = null;

  async getStats(): Promise<Stats> {
    const response = await fetch(`${API_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  async getWallets(limit = 100, offset = 0, search?: string): Promise<{
    wallets: Wallet[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${API_URL}/wallets?${params}`);
    if (!response.ok) throw new Error('Failed to fetch wallets');
    return response.json();
  }

  async getWallet(address: string): Promise<Wallet & {
    transactions: any[];
    hasClaimed: boolean;
    explorerUrl: string;
  }> {
    const response = await fetch(`${API_URL}/wallet/${address}`);
    if (!response.ok) throw new Error('Failed to fetch wallet');
    return response.json();
  }

  async getTopWallets(limit = 100): Promise<Wallet[]> {
    const response = await fetch(`${API_URL}/top-wallets?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch top wallets');
    return response.json();
  }

  async getScannerStatus(): Promise<any> {
    const response = await fetch(`${API_URL}/scanner/status`);
    if (!response.ok) throw new Error('Failed to fetch scanner status');
    return response.json();
  }

  connectWebSocket(
    onStatsUpdate?: (stats: Stats) => void,
    onNewClaim?: (claim: any) => void
  ): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket?.emit('get-stats');
    });

    if (onStatsUpdate) {
      this.socket.on('stats-update', onStatsUpdate);
    }

    if (onNewClaim) {
      this.socket.on('new-claim', onNewClaim);
    }

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  disconnectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const apiService = new ApiService();