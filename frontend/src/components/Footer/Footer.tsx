export default function Footer() {
  return (
    <footer className="relative z-10 max-w-6xl mx-auto px-4 py-12 mt-16 border-t border-white/10">
      <div className="text-center space-y-3">
        <p className="text-gray-400 text-sm">
          Data sourced directly from 0G blockchain
        </p>
        <p className="text-gray-500 text-sm">
          Last updated: {new Date().toLocaleString()}
        </p>
        <p className="text-gray-400 text-sm mt-6 max-w-2xl mx-auto">
          This is an independent transparency initiative providing
          verifiable on-chain data about the 0G token distribution.
        </p>
        <p className="text-gray-500 text-xs mt-3">
          Note: Test wallet (0x2af0...e42a) with 3.17M W0G has been excluded from calculations.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>Chain ID: 16661</span>
          <span>•</span>
          <span>RPC: evmrpc.0g.ai</span>
        </div>
      </div>
    </footer>
  );
}