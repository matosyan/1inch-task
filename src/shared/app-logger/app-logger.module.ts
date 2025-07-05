import { AppLogger } from './app-logger';
import { APP_LOGGER_OPTIONS } from './constants';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { AppLoggerOptions, AppLoggerAsyncOptions, AppLoggerOptionsFactory } from './interfaces';

const modules = [];

@Global()
@Module({})
export class AppLoggerModule {
  public static forRoot(configOptions: AppLoggerOptions): DynamicModule {
    return {
      module: AppLoggerModule,
      imports: modules,
      providers: [
        {
          provide: APP_LOGGER_OPTIONS,
          useValue: configOptions,
        },
        AppLogger,
      ],
      exports: [AppLogger],
    };
  }

  public static forRootAsync(configOptions: AppLoggerAsyncOptions): DynamicModule {
    return {
      module: AppLoggerModule,
      imports: [...(configOptions.imports || []), ...modules],
      providers: [...this.createConfigAsyncProvider(configOptions), AppLogger],
      exports: [AppLogger],
    };
  }

  private static createConfigAsyncProvider(options: AppLoggerAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: APP_LOGGER_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    } else {
      const providers = [];

      if (options.useClass) {
        providers.push({
          provide: options.useClass,
          useClass: options.useClass,
        });
      }

      providers.push({
        provide: APP_LOGGER_OPTIONS,
        useFactory: async (optionsFactory: AppLoggerOptionsFactory): Promise<AppLoggerOptions> => {
          return optionsFactory.createAppLoggerOptions();
        },
        inject: [...(options.inject || []), options.useClass || options.useExisting],
      });

      return providers;
    }
  }
}
