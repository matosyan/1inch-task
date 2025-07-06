import { EthersOptions } from './ethers-options.interface';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { EthersOptionsFactory } from './ethers-options.factory';

export interface EthersAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useExisting?: Type<EthersOptionsFactory>;
  useClass?: Type<EthersOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<EthersOptions> | EthersOptions;
}
