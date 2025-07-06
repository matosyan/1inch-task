import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { GasPriceDto } from './dto/gas-price.dto';

@Injectable()
export class GasPriceService {
  private readonly logger = new Logger(GasPriceService.name);
  private cachedGasPrice: GasPriceDto | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10000; // 10 seconds cache

  constructor(private blockchainService: BlockchainService) {
    // Initialize cache on service start
    this.fetchGasPrice();

    // Set up periodic updates every 10 seconds
    setInterval(() => {
      this.fetchGasPrice();
    }, this.CACHE_DURATION);
  }

  async getGasPrice(): Promise<GasPriceDto> {
    // If we have cached data and it's still valid, return it immediately
    if (this.cachedGasPrice && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      return this.cachedGasPrice;
    }

    // If no cached data, fetch synchronously (this should rarely happen due to background updates)
    return this.fetchGasPrice();
  }

  private async fetchGasPrice(): Promise<GasPriceDto> {
    try {
      const provider = this.blockchainService.getProvider();
      const feeData = await provider.getFeeData();

      const gasPrice: GasPriceDto = {
        gasPrice: feeData.gasPrice?.toString() || '0',
        maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
        timestamp: Date.now(),
      };

      this.cachedGasPrice = gasPrice;
      this.lastFetchTime = Date.now();

      this.logger.debug('Gas price updated', gasPrice);
      return gasPrice;
    } catch (error) {
      this.logger.error('Failed to fetch gas price', error);

      // Return cached data if available, otherwise throw error
      if (this.cachedGasPrice) {
        this.logger.warn('Returning cached gas price due to fetch error');
        return this.cachedGasPrice;
      }

      throw error;
    }
  }
}
