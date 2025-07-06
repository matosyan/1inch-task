import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerOptions, AppLoggerOptionsFactory } from '../../packages/app-logger/interfaces';

@Injectable()
export class AppLoggerConfigService implements AppLoggerOptionsFactory {
  constructor(private config: ConfigService) {}

  createAppLoggerOptions(): Promise<AppLoggerOptions> | AppLoggerOptions {
    return {
      provider: this.config.get('logging.provider'),
      config: {
        level: this.config.get('logging.level'),
      },
    };
  }
}
