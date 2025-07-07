import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerOptionsFactory, ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Configuration options for different endpoint types
 */
export interface ThrottlerEndpointConfig {
  ttl: number; // Time to live in seconds
  limit: number; // Number of requests allowed
  name: string; // Configuration name
}

/**
 * Default throttling configurations for different endpoint types
 */
export const THROTTLER_CONFIGS = {
  // Gas price endpoint - allows more frequent requests due to caching
  GAS_PRICE: {
    name: 'gas-price',
    ttl: 60, // 1 minute window
    limit: 100, // 100 requests per minute
  } as ThrottlerEndpointConfig,

  // UniswapV2 calculation endpoint - more restrictive due to computation cost
  UNISWAP_CALCULATION: {
    name: 'uniswap-calculation',
    ttl: 60, // 1 minute window
    limit: 30, // 30 requests per minute
  } as ThrottlerEndpointConfig,

  // General API endpoints - moderate limits
  GENERAL: {
    name: 'general',
    ttl: 60, // 1 minute window
    limit: 60, // 60 requests per minute
  } as ThrottlerEndpointConfig,

  // Health check endpoints - very permissive
  HEALTH_CHECK: {
    name: 'health-check',
    ttl: 60, // 1 minute window
    limit: 300, // 300 requests per minute
  } as ThrottlerEndpointConfig,
} as const;

@Injectable()
export class ThrottlerConfigService implements ThrottlerOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates throttler module options with environment-based configuration
   * @returns ThrottlerModuleOptions configuration
   */
  createThrottlerOptions(): ThrottlerModuleOptions {
    const isProduction = this.configService.get('app.env') === 'production';
    const isDevelopment = this.configService.get('app.env') === 'development';

    return {
      throttlers: [
        {
          name: THROTTLER_CONFIGS.GENERAL.name,
          ttl: this.getThrottlerTtl(THROTTLER_CONFIGS.GENERAL.ttl, isDevelopment),
          limit: this.getThrottlerLimit(THROTTLER_CONFIGS.GENERAL.limit, isDevelopment),
        },
        {
          name: THROTTLER_CONFIGS.GAS_PRICE.name,
          ttl: this.getThrottlerTtl(THROTTLER_CONFIGS.GAS_PRICE.ttl, isDevelopment),
          limit: this.getThrottlerLimit(THROTTLER_CONFIGS.GAS_PRICE.limit, isDevelopment),
        },
        {
          name: THROTTLER_CONFIGS.UNISWAP_CALCULATION.name,
          ttl: this.getThrottlerTtl(THROTTLER_CONFIGS.UNISWAP_CALCULATION.ttl, isDevelopment),
          limit: this.getThrottlerLimit(THROTTLER_CONFIGS.UNISWAP_CALCULATION.limit, isDevelopment),
        },
        {
          name: THROTTLER_CONFIGS.HEALTH_CHECK.name,
          ttl: this.getThrottlerTtl(THROTTLER_CONFIGS.HEALTH_CHECK.ttl, isDevelopment),
          limit: this.getThrottlerLimit(THROTTLER_CONFIGS.HEALTH_CHECK.limit, isDevelopment),
        },
      ],
      // Skip throttling if behind a proxy (common in production deployments)
      skipIf: () => false,
      // Ignore user agents (can be customized if needed)
      ignoreUserAgents: [],
      // Use X-Forwarded-For header for proxy setups
      getTracker: (req) => (req.ips.length ? req.ips[0] : req.ip),
      // Custom storage can be added here (Redis, etc.)
      // storage: new ThrottlerStorageRedisService(redisService),
    };
  }

  /**
   * Adjusts TTL based on environment
   * @param baseTtl - Base TTL in seconds
   * @param isDevelopment - Whether in development environment
   * @returns Adjusted TTL in milliseconds
   */
  private getThrottlerTtl(baseTtl: number, isDevelopment: boolean): number {
    // Convert seconds to milliseconds for @nestjs/throttler v6+
    const ttlMs = baseTtl * 1000;

    // In development, use longer windows for easier testing
    return isDevelopment ? ttlMs * 2 : ttlMs;
  }

  /**
   * Adjusts limit based on environment
   * @param baseLimit - Base limit count
   * @param isDevelopment - Whether in development environment
   * @returns Adjusted limit
   */
  private getThrottlerLimit(baseLimit: number, isDevelopment: boolean): number {
    // In development, allow more requests for easier testing
    return isDevelopment ? baseLimit * 2 : baseLimit;
  }

  /**
   * Gets configuration for a specific endpoint type
   * @param configType - The configuration type
   * @returns Throttler endpoint configuration
   */
  static getEndpointConfig(configType: keyof typeof THROTTLER_CONFIGS): ThrottlerEndpointConfig {
    return THROTTLER_CONFIGS[configType];
  }
}
