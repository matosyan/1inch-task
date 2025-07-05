import { OpenAIOptions } from './openai-options.interface';

export interface OpenAIOptionsFactory {
  createOpenAIOptions(): Promise<OpenAIOptions> | OpenAIOptions;
}
