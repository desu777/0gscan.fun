import { defineChain } from 'viem';
import { parseAbi } from 'viem';

export const zeroGChain = defineChain({
  id: 16661,
  name: '0G-Mainnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc.0g.ai'] },
    public: { http: ['https://evmrpc.0g.ai'] }
  },
  blockExplorers: {
    default: { name: 'ChainScan', url: 'https://chainscan.0g.ai' }
  }
});

export const CONTRACTS = {
  AIRDROP: '0x6A9c6b5507E322Aa00eb9c45e80c07AB63acabB6',
  W0G_TOKEN: '0x1cd0690ff9a693f5ef2dd976660a8dafc81a109c',
  AIRDROP_WALLET: '0xB03e8e11730228c2d03270bCD1Ab57818D7B6D8c',
  ADMIN_WALLET: '0xCcd7aF961cEDA6Bd383FeA1EcC2fFAa410d991E9'
};

export const ERC20_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]);

export const AIRDROP_ABI = parseAbi([
  'event Claimed(address indexed user, uint256 amount)',
  'function claim(uint256 amount, bytes32[] calldata merkleProof) external',
  'function hasClaimed(address user) view returns (bool)',
  'function merkleRoot() view returns (bytes32)'
]);