import { RedisClientOptions } from 'redis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { CacheStore, CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  async createCacheOptions(): Promise<CacheModuleOptions | RedisClientOptions> {
    const store = await redisStore({
      socket: {
        host: this.config.get<string>('redis.host'),
        port: this.config.get<number>('redis.port'),
        connectTimeout: this.config.get<number>('redis.connectTimeout'),
      },
      username: this.config.get<string>('redis.username'),
      password: this.config.get<string>('redis.password'),
      ttl: this.config.get<number>('redis.ttl'),
      database: this.config.get<number>('redis.db'),
      pingInterval: this.config.get<number>('redis.pingInterval'),
    });

    return {
      store: store as unknown as CacheStore,
    };
  }
}
