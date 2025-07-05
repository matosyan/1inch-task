import { CryptoService } from './crypto.service';
import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class CryptoModule {
  public static register(): DynamicModule {
    return {
      module: CryptoModule,
      imports: [],
      providers: [CryptoService],
      exports: [CryptoService],
    };
  }
}
