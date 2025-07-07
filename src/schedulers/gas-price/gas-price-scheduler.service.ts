import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GasPriceDto, GasPriceRepository } from '../../repositories';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { EthersService } from '../../packages/ethers/ethers.service';

@Injectable()
export class GasPriceSchedulerService {
  private readonly CACHE_VALIDITY_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly REFRESH_INTERVAL_SECONDS = 10; // 10 seconds

  constructor(
    private readonly logger: AppLogger,
    private readonly ethersService: EthersService,
    private readonly gasPriceRepository: GasPriceRepository,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: GasPriceSchedulerService.name,
  })
  async refreshGasPrice(): Promise<boolean> {
    this.logger.debug({
      message: 'Preparing to fetch gas price',
      resourceName: GasPriceSchedulerService.name,
    });

    try {
      const isConnected = await this.ethersService.isConnected();

      if (!isConnected) {
        this.logger.warn({
          message: 'Ethers provider not connected',
          resourceName: GasPriceSchedulerService.name,
        });

        return false;
      }

      if (this.isCacheValid()) {
        this.logger.debug({
          message: 'Gas price cache is still valid, skipping fetch',
          resourceName: GasPriceSchedulerService.name,
        });

        return true;
      }

      const feeData = await this.ethersService.getFeeData();

      const gasPrice: GasPriceDto = {
        gasPrice: feeData.gasPrice.toString(),
        maxFeePerGas: feeData.maxFeePerGas.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.toString(),
        timestamp: Date.now(),
      };

      this.gasPriceRepository.gasPrice = gasPrice;

      this.logger.debug({
        message: 'Gas price updated successfully',
        data: { gasPrice },
        resourceName: GasPriceSchedulerService.name,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to fetch and update gas price',
        data: { error },
        resourceName: GasPriceSchedulerService.name,
      });

      return false;
    }
  }

  /**
   * Checks if the cached gas price data is still valid
   * @returns true if cache is valid, false otherwise
   */
  private isCacheValid(): boolean {
    const gasPriceData = this.gasPriceRepository.gasPrice;

    if (!gasPriceData) {
      return false;
    }

    const cacheAge = Date.now() - gasPriceData.timestamp;
    return cacheAge < this.CACHE_VALIDITY_DURATION;
  }

  /**
   * Gets the current cache age in milliseconds
   * @returns cache age in milliseconds, or null if no cache exists
   */
  getCacheAge(): number | null {
    const gasPriceData = this.gasPriceRepository.gasPrice;

    if (!gasPriceData) {
      return null;
    }

    return Date.now() - gasPriceData.timestamp;
  }

  /**
   * Checks if cached data exists
   * @returns true if cache exists, false otherwise
   */
  hasCachedData(): boolean {
    return this.gasPriceRepository.gasPrice !== null;
  }
}
