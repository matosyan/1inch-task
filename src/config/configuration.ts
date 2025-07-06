import { Environment } from '../shared/types';

export default () => ({
  app: {
    env: process.env.NODE_ENV || Environment.DEV,
    port: parseInt(process.env.APP_PORT) || 80,
    name: process.env.APP_NAME,
    version: process.env.APP_VERSION,
  },
  jwt: {
    app: {
      secret: process.env.JWT_APP_SECRET,
      expiresIn: process.env.JWT_APP_EXPIRES_IN,
    },
  },
  logging: {
    provider: process.env.APP_LOGGER_PROVIDER,
    level: process.env.APP_LOGGER_LEVEL,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  blockchain: {
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
    gasPriceCacheDuration: parseInt(process.env.GAS_PRICE_CACHE_DURATION) || 10000,
  },
});
