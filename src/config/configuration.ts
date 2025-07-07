import { Environment } from '../shared/types';

export default () => ({
  app: {
    env: process.env.NODE_ENV || Environment.DEV,
    port: parseInt(process.env.APP_PORT) || 80,
    name: process.env.APP_NAME,
    version: process.env.APP_VERSION,
  },
  logging: {
    provider: process.env.APP_LOGGER_PROVIDER,
    level: process.env.APP_LOGGER_LEVEL,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  ethers: {
    adapter: process.env.ETHERS_ADAPTER,
    infura: {
      apiKey: process.env.ETHERS_INFURA_API_KEY,
      rpc: {
        url: process.env.ETHERS_INFURA_RPC_URL,
      },
    },
  },
});
