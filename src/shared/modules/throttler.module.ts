import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerConfigService } from '../services/throttler-config.service';

/**
 * Throttler module that configures rate limiting for the application
 * This module sets up the @nestjs/throttler package with custom configuration
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useClass: ThrottlerConfigService,
    }),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
