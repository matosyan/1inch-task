import { OPENAI_OPTIONS } from './constants';
import { OpenAIService } from './openai.service';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { OpenAIOptions, OpenAIAsyncOptions, OpenAIOptionsFactory } from './interfaces';

const modules = [];

@Global()
@Module({})
export class OpenAIModule {
  public static forRoot(configOptions: OpenAIOptions): DynamicModule {
    return {
      module: OpenAIModule,
      imports: modules,
      providers: [
        {
          provide: OPENAI_OPTIONS,
          useValue: configOptions,
        },
        OpenAIService,
      ],
      exports: [OpenAIService],
    };
  }

  public static forRootAsync(configOptions: OpenAIAsyncOptions): DynamicModule {
    return {
      module: OpenAIModule,
      imports: [...(configOptions.imports || []), ...modules],
      providers: [...this.createConfigAsyncProvider(configOptions), OpenAIService],
      exports: [OpenAIService],
    };
  }

  private static createConfigAsyncProvider(options: OpenAIAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: OPENAI_OPTIONS,
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
        provide: OPENAI_OPTIONS,
        useFactory: async (optionsFactory: OpenAIOptionsFactory): Promise<OpenAIOptions> => {
          return optionsFactory.createOpenAIOptions();
        },
        inject: [...(options.inject || []), options.useClass || options.useExisting],
      });

      return providers;
    }
  }
}
