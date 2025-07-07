import { Module } from '@nestjs/common';
import { GasPriceSchedulerService } from './gas-price-scheduler.service';
import { GasPriceRepository } from '../../repositories';

@Module({
  imports: [],
  providers: [GasPriceSchedulerService, GasPriceRepository],
})
export class GasPriceSchedulerModule {}
