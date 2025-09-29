import { useState } from 'react';
import { ExternalLink, Download, Search, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { apiService, Wallet } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

export default function WalletTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'phase1' | 'phase2' | 'address'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Fetch wallets data
  const { data, isLoading: loading } = useQuery({
    queryKey: ['wallets', currentPage, rowsPerPage, searchTerm],
    queryFn: () => apiService.getWallets(rowsPerPage, (currentPage - 1) * rowsPerPage, searchTerm),
  });

  const wallets = data?.wallets || [];
  const totalWallets = data?.total || 0;
  const totalPages = Math.ceil(totalWallets / rowsPerPage);

  // Sort wallets
  const sortedWallets = [...wallets].sort((a, b) => {
    let aValue = 0, bValue = 0;

    switch (sortBy) {
      case 'phase1':
        aValue = parseFloat(a.phase1_amount || '0') / 1e18;
        bValue = parseFloat(b.phase1_amount || '0') / 1e18;
        break;
      case 'phase2':
        aValue = a.phase2_amount || 0;
        bValue = b.phase2_amount || 0;
        break;
      case 'total':
        aValue = (parseFloat(a.phase1_amount || '0') / 1e18) + (a.phase2_amount || 0);
        bValue = (parseFloat(b.phase1_amount || '0') / 1e18) + (b.phase2_amount || 0);
        break;
      case 'address':
        return sortOrder === 'asc'
          ? a.address.localeCompare(b.address)
          : b.address.localeCompare(a.address);
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Export to CSV
  const exportToCSV = async () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/export/csv`, '_blank');
  };

  // Handle sorting
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate totals
  const calculateTotal = (wallet: Wallet) => {
    const phase1 = parseFloat(wallet.phase1_amount || '0') / 1e18;
    const phase2 = wallet.phase2_amount || 0;
    return phase1 + phase2;
  };

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-poppins font-light text-white mb-6 text-center">
        Airdrop Recipients
      </h2>

      {/* Controls */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search wallet address..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Row selector and Export */}
          <div className="flex gap-3 items-center">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              style={{ backgroundColor: 'rgba(17, 24, 39, 0.9)' }}
            >
              <option value={10} className="bg-gray-900">10 rows</option>
              <option value={25} className="bg-gray-900">25 rows</option>
              <option value={50} className="bg-gray-900">50 rows</option>
              <option value={100} className="bg-gray-900">100 rows</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('address')}
                    className="text-gray-400 hover:text-white transition-colors font-poppins text-sm"
                  >
                    Wallet Address {sortBy === 'address' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort('phase1')}
                    className="text-gray-400 hover:text-white transition-colors font-poppins text-sm"
                  >
                    Phase 1 (0G) {sortBy === 'phase1' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort('phase2')}
                    className="text-gray-400 hover:text-white transition-colors font-poppins text-sm"
                  >
                    Phase 2 (0G) {sortBy === 'phase2' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort('total')}
                    className="text-gray-400 hover:text-white transition-colors font-poppins text-sm"
                  >
                    Total (0G) {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="text-gray-400 font-poppins text-sm">Status</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedWallets.map((wallet) => {
                const phase1Amount = parseFloat(wallet.phase1_amount || '0') / 1e18;
                const phase2Amount = wallet.phase2_amount || 0;
                const totalAmount = calculateTotal(wallet);
                const hasPhase1 = phase1Amount > 0;
                const hasPhase2 = phase2Amount > 0;

                return (
                  <tr key={wallet.address} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://chainscan.0g.ai/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center gap-1"
                        >
                          {formatAddress(wallet.address)}
                          <ExternalLink size={12} />
                        </a>
                        <button
                          onClick={() => copyAddress(wallet.address)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedAddress === wallet.address ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {phase1Amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {phase2Amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white font-semibold">
                      {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        {hasPhase1 && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">P1</span>
                        )}
                        {hasPhase2 && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">P2</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {sortedWallets.map((wallet) => {
            const phase1Amount = parseFloat(wallet.phase1_amount || '0') / 1e18;
            const phase2Amount = wallet.phase2_amount || 0;
            const totalAmount = calculateTotal(wallet);

            return (
              <div key={wallet.address} className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <a
                    href={`https://chainscan.0g.ai/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center gap-1"
                  >
                    {formatAddress(wallet.address)}
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Phase 1:</span>
                    <p className="font-mono text-white">{phase1Amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Phase 2:</span>
                    <p className="font-mono text-white">{phase2Amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total:</span>
                    <p className="font-mono text-white font-semibold">{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center text-gray-400">
            Loading wallets...
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedWallets.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No wallets found
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-gray-400 text-sm">
            Showing {Math.min((currentPage - 1) * rowsPerPage + 1, totalWallets)}-{Math.min(currentPage * rowsPerPage, totalWallets)} of {totalWallets.toLocaleString()} wallets
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}