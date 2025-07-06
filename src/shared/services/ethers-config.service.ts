import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EtherAdapter } from '../../packages/ethers/types';
import { EthersOptions, EthersOptionsFactory } from '../../packages/ethers/interfaces';

@Injectable()
export class EthersConfigService implements EthersOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createEthersOptions(): Promise<EthersOptions> | EthersOptions {
    return {
      adapter: this.config.get('ethers.adapter') as EtherAdapter,
      infura: {
        apiKey: this.config.get('ethers.infura.apiKey'),
        rpc: {
          url: this.config.get('ethers.infura.rpc.url'),
        },
      },
    };
  }
}
