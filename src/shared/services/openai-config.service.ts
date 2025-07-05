import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIOptions, OpenAIOptionsFactory } from '../openai/interfaces';

@Injectable()
export class OpenAIConfigService implements OpenAIOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createOpenAIOptions(): OpenAIOptions | Promise<OpenAIOptions> {
    return {
      apiKey: this.config.get('openai.apiKey'),
    };
  }
}
