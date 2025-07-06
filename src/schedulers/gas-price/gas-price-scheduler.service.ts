import { GasPriceDto } from './dto';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { EthersService } from '../../packages/ethers/ethers.service';

@Injectable()
export class GasPriceSchedulerService {
  constructor(
    private readonly logger: AppLogger,
    private readonly ethersService: EthersService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: GasPriceSchedulerService.name,
  })
  async refreshGasPrice() {
    this.logger.debug({
      message: `Preparing to fetch gas price`,
      resourceName: GasPriceSchedulerService.name,
    });

    const gasPrice = await this.fetchGasPrice();

    if (gasPrice) {
      this.logger.debug({
        message: `Gas price fetched`,
        data: { gasPrice },
        resourceName: GasPriceSchedulerService.name,
      });
    }

    return true;
  }

  private async fetchGasPrice(): Promise<GasPriceDto> {
    try {
      if (!(await this.ethersService.isConnected())) {
        this.logger.warn({
          message: `Ethers [${this}] provider not connected`,
          resourceName: GasPriceSchedulerService.name,
        });

        return;
      }

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

      return gasPrice;
    } catch (error) {
      this.logger.error({
        message: 'Failed to fetch gas price',
        data: { error },
        resourceName: GasPriceSchedulerService.name,
      });

      throw error;
    }
  }
}
