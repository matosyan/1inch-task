import { Environment } from '../shared/types';

export default () => ({
  app: {
    env: process.env.NODE_ENV || Environment.DEV,
    port: parseInt(process.env.APP_PORT) || 80,
    name: process.env.APP_NAME,
    version: process.env.APP_VERSION,
  },
  frontend: {
    hostname: process.env.FRONTEND_HOSTNAME,
  },
  logging: {
    provider: process.env.APP_LOGGER_PROVIDER,
    level: process.env.APP_LOGGER_LEVEL,
  },
  jwt: {
    app: {
      secret: process.env.JWT_APP_SECRET,
      expiresIn: process.env.JWT_APP_EXPIRES_IN,
      refresh: {
        secret: process.env.JWT_APP_REFRESH_SECRET,
        expiresIn: process.env.JWT_APP_REFRESH_EXPIRES_IN,
        days: process.env.JWT_APP_REFRESH_DAYS,
      },
    },
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT),
    pingInterval: parseInt(process.env.REDIS_PING_INTERVAL),
    retryLimit: parseInt(process.env.REDIS_RETRY_LIMIT),
    ttl: parseInt(process.env.REDIS_TTL),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_MAIN_DB),
    bull: {
      db: parseInt(process.env.REDIS_BULL_DB),
      removeOnCompleteAge: parseInt(process.env.REDIS_BULL_REMOVE_ON_COMPLETE_AGE) || 86400,
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
});
