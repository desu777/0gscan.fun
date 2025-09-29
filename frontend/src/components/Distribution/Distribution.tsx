import { useStats, useScannerStatus } from '../../hooks/useStats';
import { getRelativeTime, getTimeSinceTGE } from '../../utils/timeHelpers';

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

  // Calculate both phases (backend already excludes test wallet)
  const phase1Total = parseFloat(stats.total_w0g_distributed) / 1e18;
  const phase2Total = parseFloat(stats.total_0g_distributed);
  const delivered = phase1Total + phase2Total; // Combined Phase 1 + Phase 2
  const deliveredPercentage = (delivered / TOTAL_SUPPLY * 100).toFixed(4);
  const distributionProgress = ((delivered / PROMISED_AMOUNT) * 100).toFixed(2);
  const missing = PROMISED_AMOUNT - delivered;

  // Calculate time since TGE (September 22, 2025 - Phase 1 Airdrop)
  const TGE_DATE = new Date('2025-09-22');
  const timeSinceTGE = getTimeSinceTGE(TGE_DATE);
  const daysSinceTGE = timeSinceTGE.days;

  // Calculate time since last scan
  const lastScanTime = stats.last_update ? getRelativeTime(stats.last_update) : 'Never';

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
            Distributed of Announced
          </label>
          <span className="text-2xl font-mono text-white block">
            {distributionProgress}%
          </span>
          <span className="text-sm text-gray-500 mt-1 block">
            {delivered.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {PROMISED_AMOUNT.toLocaleString()}
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
            Scanner Status
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono text-white">Active</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm text-gray-500 mt-1 block">
            Last scan: {lastScanTime}
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
              Time Since TGE
            </label>
            <span className="text-xl font-mono text-white">
              {daysSinceTGE > 0 ? `${daysSinceTGE} days` :
               daysSinceTGE === 0 ? 'Today!' :
               `In ${Math.abs(daysSinceTGE)} days`}
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