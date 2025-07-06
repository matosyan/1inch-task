import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { EthersService } from '../../packages/ethers/ethers.service';
import { GasPriceDto, GasPriceRepository } from '../../repositories';
import { GasPriceSchedulerService } from '../../schedulers/gas-price/gas-price-scheduler.service';

@Injectable()
export class BlockchainService {
  constructor(
    private readonly gasPriceRepository: GasPriceRepository,
    private readonly ethersService: EthersService,
    private readonly logger: AppLogger,
  ) {}

  async fetchGasPrice(): Promise<void> {
    try {
      const feeData = await this.ethersService.getFeeData();

      const gasPrice: GasPriceDto = {
        gasPrice: feeData.gasPrice?.toString() || '0',
        maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
        timestamp: Date.now(),
      };

      this.logger.debug({
        message: 'Gas price updated',
        data: { gasPrice },
        resourceName: GasPriceSchedulerService.name,
      });

      this.gasPriceRepository.gasPrice = gasPrice;
    } catch (error) {
      this.logger.error({
        message: 'Failed to fetch gas price',
        data: { error },
        resourceName: GasPriceSchedulerService.name,
      });

      return null;
    }
  }
}
