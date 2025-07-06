import { EthersOptions } from './ethers-options.interface';

export interface EthersOptionsFactory {
  createEthersOptions(): Promise<EthersOptions> | EthersOptions;
}
