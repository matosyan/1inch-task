import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GasPriceSchedulerModule } from './gas-price/gas-price-scheduler.module';

@Module({
  imports: [ScheduleModule.forRoot(), GasPriceSchedulerModule],
  providers: [],
})
export class SchedulerModule {}
