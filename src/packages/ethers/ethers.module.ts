import { ETHERS_OPTIONS } from './constants';
import { EthersService } from './ethers.service';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { EthersOptions, EthersAsyncOptions, EthersOptionsFactory } from './interfaces';

const modules = [];

@Global()
@Module({})
export class EthersModule {
  public static root(configOptions: EthersOptions): DynamicModule {
    return {
      module: EthersModule,
      imports: modules,
      providers: [
        {
          provide: ETHERS_OPTIONS,
          useValue: configOptions,
        },
        EthersService,
      ],
      exports: [EthersService],
    };
  }

  public static rootAsync(configOptions: EthersAsyncOptions): DynamicModule {
    return {
      module: EthersModule,
      imports: [...(configOptions.imports || []), ...modules],
      providers: [...this.createConfigAsyncProvider(configOptions), EthersService],
      exports: [EthersService],
    };
  }

  private static createConfigAsyncProvider(options: EthersAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: ETHERS_OPTIONS,
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
        provide: ETHERS_OPTIONS,
        useFactory: async (optionsFactory: EthersOptionsFactory): Promise<EthersOptions> => {
          return optionsFactory.createEthersOptions();
        },
        inject: [...(options.inject || []), options.useClass || options.useExisting],
      });

      return providers;
    }
  }
}
