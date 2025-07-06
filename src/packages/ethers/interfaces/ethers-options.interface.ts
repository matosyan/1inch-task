import { EtherAdapter } from '../types';

export interface EthersOptions {
  adapter: EtherAdapter;
  infura?: {
    apiKey: string;
    rpc: {
      url: string;
    };
  };
}
