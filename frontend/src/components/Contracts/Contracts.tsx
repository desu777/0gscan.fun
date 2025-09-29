import { ExternalLink } from 'lucide-react';

export default function Contracts() {
  const contracts = [
    {
      label: 'W0G Token Contract',
      address: '0x1cd0690ff9a693f5ef2dd976660a8dafc81a109c',
      description: 'Community airdrop token',
    },
    {
      label: 'Airdrop Contract',
      address: '0x6A9c6b5507E322Aa00eb9c45e80c07AB63acabB6',
      description: 'Claim contract for W0G',
    },
    {
      label: 'Distribution Wallet',
      address: '0xB03e8e11730228c2d03270bCD1Ab57818D7B6D8c',
      description: 'Node operator distributions',
    },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-poppins font-light text-white mb-8 text-center">
        Verifiable Contracts
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {contracts.map((contract, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6"
          >
            <div className="mb-3">
              <label className="text-gray-400 text-sm font-poppins block mb-1">
                {contract.label}
              </label>
              <p className="text-xs text-gray-500">
                {contract.description}
              </p>
            </div>

            <a
              href={`https://chainscan.0g.ai/address/${contract.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="font-mono text-sm break-all">
                {contract.address}
              </span>
              <ExternalLink className="flex-shrink-0" size={14} />
            </a>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-400 mb-2">
          All data can be independently verified on 0G Chain Explorer
        </p>
        <a
          href="https://chainscan.0g.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>0G Chain Explorer</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}