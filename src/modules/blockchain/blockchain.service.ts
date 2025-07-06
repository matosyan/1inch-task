import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;

  constructor(private configService: ConfigService) {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    // You can configure this via environment variables
    const rpcUrl =
      this.configService.get<string>('ETHEREUM_RPC_URL') ||
      'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.logger.log('Ethereum provider initialized');
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      this.logger.error('Failed to get block number', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch (error) {
      this.logger.error(`Failed to get balance for address ${address}`, error);
      throw error;
    }
  }

  async getContract(address: string, abi: any[]): Promise<ethers.Contract> {
    return new ethers.Contract(address, abi, this.provider);
  }
}
