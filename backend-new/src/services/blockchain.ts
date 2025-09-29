import { createPublicClient, http, formatUnits, Log, Transaction as ViemTransaction } from 'viem';
import { zeroGChain, CONTRACTS, ERC20_ABI, AIRDROP_ABI } from '../config/blockchain';

export class BlockchainService {
  private client;

  constructor() {
    this.client = createPublicClient({
      chain: zeroGChain,
      transport: http(),
    });
  }

  async getCurrentBlock(): Promise<bigint> {
    return await this.client.getBlockNumber();
  }

  async getBlock(blockNumber: bigint) {
    return await this.client.getBlock({
      blockNumber,
      includeTransactions: true
    });
  }

  async getTransaction(hash: string) {
    return await this.client.getTransaction({
      hash: hash as `0x${string}`
    });
  }

  async getTransactionReceipt(hash: string) {
    return await this.client.getTransactionReceipt({
      hash: hash as `0x${string}`
    });
  }

  async getW0GTransferEvents(fromBlock: bigint, toBlock: bigint): Promise<Log[]> {
    return await this.client.getLogs({
      address: CONTRACTS.W0G_TOKEN as `0x${string}`,
      event: ERC20_ABI[0],
      fromBlock,
      toBlock,
    });
  }

  async getAirdropClaimEvents(fromBlock: bigint, toBlock: bigint): Promise<Log[]> {
    try {
      return await this.client.getLogs({
        address: CONTRACTS.AIRDROP as `0x${string}`,
        event: AIRDROP_ABI[0],
        fromBlock,
        toBlock,
      });
    } catch (error) {
      console.log('No claim events found or ABI mismatch');
      return [];
    }
  }

  async getTransactionsToContract(
    contractAddress: string,
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<ViemTransaction[]> {
    const transactions: ViemTransaction[] = [];

    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
      try {
        const block = await this.client.getBlock({
          blockNumber,
          includeTransactions: true
        });

        const contractTxs = block.transactions.filter(
          tx => tx.to?.toLowerCase() === contractAddress.toLowerCase()
        );

        transactions.push(...contractTxs);
      } catch (error) {
        console.error(`Error fetching block ${blockNumber}:`, error);
      }
    }

    return transactions;
  }

  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      const balance = await this.client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });
      return formatUnits(balance as bigint, 18);
    } else {
      const balance = await this.client.getBalance({
        address: address as `0x${string}`
      });
      return formatUnits(balance, 18);
    }
  }

  async getTokenInfo(tokenAddress: string) {
    const [name, symbol, decimals] = await Promise.all([
      this.client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'name'
      }),
      this.client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol'
      }),
      this.client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals'
      })
    ]);

    return { name, symbol, decimals };
  }

  async hasClaimed(userAddress: string): Promise<boolean> {
    try {
      const hasClaimed = await this.client.readContract({
        address: CONTRACTS.AIRDROP as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: 'hasClaimed',
        args: [userAddress as `0x${string}`]
      });
      return hasClaimed as boolean;
    } catch (error) {
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();