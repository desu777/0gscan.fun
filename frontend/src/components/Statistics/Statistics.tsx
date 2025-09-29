import { useStats } from '../../hooks/useStats';

export default function Statistics() {
  const { stats, loading } = useStats();

  if (loading || !stats) {
    return (
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-white/5 rounded-lg"></div>
        </div>
      </section>
    );
  }

  const statistics = [
    {
      label: 'Total Recipients',
      value: stats.total_wallets.toLocaleString(),
      description: 'Unique wallet addresses',
    },
    {
      label: 'Phase 1 Recipients',
      value: (stats.phase1_wallets - 1).toLocaleString(), // Excluding test wallet
      description: 'W0G token claims (excl. test)',
    },
    {
      label: 'Phase 2 Recipients',
      value: stats.phase2_wallets.toLocaleString(),
      description: 'Direct 0G transfers',
    },
    {
      label: 'Both Phases',
      value: stats.overlapping_wallets.toLocaleString(),
      description: 'Received from both distributions',
    },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-poppins font-light text-white mb-8 text-center">
        Recipient Statistics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statistics.map((stat, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center"
          >
            <div className="text-3xl font-mono text-white mb-2">
              {stat.value}
            </div>
            <div className="text-sm font-poppins text-white mb-1">
              {stat.label}
            </div>
            <div className="text-xs text-gray-500">
              {stat.description}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-poppins text-white mb-4">Phase 1 - Community Airdrop</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Method:</span>
              <span className="text-white font-mono">W0G Token Claims</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Recipients:</span>
              <span className="text-white font-mono">{(stats.phase1_wallets - 1).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total W0G:</span>
              <span className="text-white font-mono">
                {((parseFloat(stats.total_w0g_distributed) / 1e18) - 3170000).toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-poppins text-white mb-4">Phase 2 - Node Operators</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Method:</span>
              <span className="text-white font-mono">Direct Transfers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Recipients:</span>
              <span className="text-white font-mono">{stats.phase2_wallets.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total 0G:</span>
              <span className="text-white font-mono">
                {(parseFloat(stats.total_0g_distributed) / 1e18).toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}