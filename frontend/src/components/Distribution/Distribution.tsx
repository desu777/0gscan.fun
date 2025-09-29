import { useStats, useScannerStatus } from '../../hooks/useStats';

export default function Distribution() {
  const { stats, loading } = useStats();
  const { data: scannerStatus } = useScannerStatus();

  if (loading || !stats) {
    return (
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-white/5 rounded-lg"></div>
        </div>
      </section>
    );
  }

  const PROMISED_AMOUNT = 26_000_000;
  const PROMISED_PERCENTAGE = 2.6;
  const TOTAL_SUPPLY = 1_000_000_000;
  const TEST_WALLET_AMOUNT = 3_170_000; // Test wallet excluded

  const totalDistributed = parseFloat(stats.total_w0g_distributed) / 1e18;
  const delivered = totalDistributed - TEST_WALLET_AMOUNT; // Exclude test wallet
  const deliveredPercentage = (delivered / TOTAL_SUPPLY * 100).toFixed(4);
  const distributionProgress = ((delivered / PROMISED_AMOUNT) * 100).toFixed(2);
  const missing = PROMISED_AMOUNT - delivered;

  // Calculate days since TGE (September 24, 2024 - exactly 5 days ago)
  const TGE_DATE = new Date('2024-09-24');
  const daysSinceTGE = Math.floor((Date.now() - TGE_DATE.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-poppins font-light text-white mb-8 text-center">
        Distribution Data
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
          <label className="text-gray-400 text-sm font-poppins block mb-2">
            Announced at TGE
          </label>
          <span className="text-2xl font-mono text-white block">
            {PROMISED_AMOUNT.toLocaleString()} 0G
          </span>
          <span className="text-sm text-gray-500 mt-1 block">
            {PROMISED_PERCENTAGE}% of total supply
          </span>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
          <label className="text-gray-400 text-sm font-poppins block mb-2">
            Currently Distributed
          </label>
          <span className="text-2xl font-mono text-white block">
            {delivered.toLocaleString(undefined, { maximumFractionDigits: 0 })} 0G
          </span>
          <span className="text-sm text-gray-500 mt-1 block">
            {deliveredPercentage}% of total supply
          </span>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
          <label className="text-gray-400 text-sm font-poppins block mb-2">
            Distribution Progress
          </label>
          <span className="text-2xl font-mono text-white block">
            {distributionProgress}%
          </span>
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(distributionProgress))}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
          <label className="text-gray-400 text-sm font-poppins block mb-2">
            Contract Status
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono text-white">Active</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm text-gray-500 mt-1 block">
            Day {daysSinceTGE} since TGE
          </span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-gray-400 text-sm font-poppins block mb-1">
              Remaining to Distribute
            </label>
            <span className="text-xl font-mono text-white">
              {missing.toLocaleString(undefined, { maximumFractionDigits: 0 })} 0G
            </span>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-poppins block mb-1">
              Last Block Scanned
            </label>
            <span className="text-xl font-mono text-white">
              {stats.last_block_scanned.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-poppins block mb-1">
              Last Update
            </label>
            <span className="text-xl font-mono text-white">
              {new Date(stats.last_update).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {scannerStatus?.isScanning && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">
                Scanner is actively monitoring the blockchain
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}