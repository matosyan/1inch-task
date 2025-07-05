import { AppLoggerOptions } from './app-logger-options.interface';

export interface AppLoggerOptionsFactory {
  createAppLoggerOptions(): Promise<AppLoggerOptions> | AppLoggerOptions;
}
