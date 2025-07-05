import { AppLoggerOptions } from './interfaces';
import { APP_LOGGER_OPTIONS } from './constants';
import { WinstonLogger } from './winston.logger';
import { Inject, Injectable } from '@nestjs/common';

export interface AppLoggerInterface {
  info(message: any, context?: string): void;
  error(message: any, trace?: string, context?: string): void;
  warn(message: any, context?: string): void;
  debug(message: any, context?: string): void;
  verbose(message: any, context?: string): void;
}

@Injectable()
export class AppLogger implements AppLoggerInterface {
  private logger: AppLoggerInterface;

  constructor(
    @Inject(APP_LOGGER_OPTIONS)
    private readonly options: AppLoggerOptions,
  ) {
    this.logger = this.createLogger();
  }

  private createLogger(): AppLoggerInterface {
    switch (this.options.provider) {
      case 'winston':
        return new WinstonLogger(this.options.config);
      case 'pino':
        throw new Error('Pino is not supported yet');
      default:
        return new WinstonLogger(this.options.config); // Default to Winston
    }
  }

  info(message: any, context?: string): void {
    this.logger.info(message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, context);
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, context);
  }
}
