import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EthersModule } from 'src/packages/ethers/ethers.module';
import { GasPriceSchedulerService } from './gas-price-scheduler.service';

@Module({
  imports: [],
  providers: [GasPriceSchedulerService],
  exports: [GasPriceSchedulerService],
})
export class GasPriceSchedulerModule {}
