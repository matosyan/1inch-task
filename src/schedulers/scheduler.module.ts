import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GasPriceSchedulerService } from './gas-price/gas-price-scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [GasPriceSchedulerService],
})
export class SchedulerModule {}
