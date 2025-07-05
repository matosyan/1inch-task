import winston, { Logger, LoggerOptions } from 'winston';
import { AppLoggerInterface } from './app-logger';

export class WinstonLogger implements AppLoggerInterface {
  private context?: string;
  private logger: Logger;

  constructor(private options: LoggerOptions) {
    this.logger = winston.createLogger({
      level: this.options?.level || 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  info(message: any, context?: string): any {
    context = context || this.context;

    if (!!message && 'object' === typeof message) {
      const { message: msg, level = 'info', ...meta } = message;

      return this.logger.log(level, msg as string, { context, ...meta });
    }

    return this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string): any {
    context = context || this.context;

    if (message instanceof Error) {
      const { message: msg, stack, ...meta } = message;

      return this.logger.error(msg, {
        context,
        stack: [trace || stack],
        error: message,
        ...meta,
      });
    }

    if (!!message && 'object' === typeof message) {
      const { message: msg, ...meta } = message;

      return this.logger.error(msg as string, {
        context,
        stack: [trace],
        ...meta,
      });
    }

    return this.logger.error(message, { context, stack: [trace] });
  }

  warn(message: any, context?: string): any {
    context = context || this.context;

    if (!!message && 'object' === typeof message) {
      const { message: msg, ...meta } = message;

      return this.logger.warn(msg as string, { context, ...meta });
    }

    return this.logger.warn(message, { context });
  }

  debug(message: any, context?: string): any {
    context = context || this.context;

    if (!!message && 'object' === typeof message) {
      const { message: msg, ...meta } = message;

      return this.logger.debug(msg as string, { context, ...meta });
    }

    return this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string): any {
    context = context || this.context;

    if (!!message && 'object' === typeof message) {
      const { message: msg, ...meta } = message;

      return this.logger.verbose(msg as string, { context, ...meta });
    }

    return this.logger.verbose(message, { context });
  }
}
