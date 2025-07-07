import { Injectable } from '@nestjs/common';

/**
 * Custom throttler guard implementation
 * This service is used as a marker for the throttler module
 * The actual throttling is handled by the @nestjs/throttler module
 */
@Injectable()
export class CustomThrottlerGuard {
  // This is a placeholder service
  // The actual throttling logic is handled by the ThrottlerModule configuration
}
