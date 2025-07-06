import { ethers } from 'ethers';
import { EtherAdapter } from './types';
import { ETHERS_OPTIONS } from './constants';
import { EthersOptions } from './interfaces';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EthersService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;

  constructor(
    @Inject(ETHERS_OPTIONS)
    private readonly options: EthersOptions,
  ) {}

  onModuleInit(): void {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    switch (this.options.adapter) {
      case EtherAdapter.INFURA:
        this.initializeInfuraProvider();
        break;
      default:
        throw new Error('Invalid provider');
    }
  }

  private initializeInfuraProvider(): void {
    try {
      const rpcUrl = `${this.options.infura?.rpc.url}/${this.options.infura?.apiKey}`;
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Checks if the provider is connected and can communicate with the network
   * @returns Promise resolving to true if connected, false otherwise
   */
  async isConnected(): Promise<boolean> {
    try {
      if (!this.provider) {
        return false;
      }

      // Test connection by getting network information
      await this.provider.getNetwork();

      return true;
    } catch (error) {
      return false;
    }
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getFeeData(): Promise<ethers.FeeData> {
    return this.provider.getFeeData();
  }

  async getBlockNumber(): Promise<number> {
    try {
      return this.provider.getBlockNumber();
    } catch (error) {
      throw error;
    }
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch (error) {
      throw error;
    }
  }

  async getContract(address: string, abi: any[]): Promise<ethers.Contract> {
    return new ethers.Contract(address, abi, this.provider);
  }
}
