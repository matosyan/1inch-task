import { OpenAIOptions } from './openai-options.interface';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { OpenAIOptionsFactory } from './openai-options.factory';

export interface OpenAIAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useExisting?: Type<OpenAIOptionsFactory>;
  useClass?: Type<OpenAIOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<OpenAIOptions> | OpenAIOptions;
}
