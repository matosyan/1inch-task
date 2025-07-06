import { AppLoggerOptions } from './app-logger-options.interface';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { AppLoggerOptionsFactory } from './app-logger-options.factory';

export interface AppLoggerAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useExisting?: Type<AppLoggerOptionsFactory>;
  useClass?: Type<AppLoggerOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<AppLoggerOptions> | AppLoggerOptions;
}
