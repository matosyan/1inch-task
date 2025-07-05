import * as Joi from 'joi';
import { Environment } from '../shared/types';

export default (() => {
  return Joi.object({
    NODE_ENV: Joi.string()
      .valid(...Object.values(Environment))
      .default(Environment.DEV),

    APP_PORT: Joi.number().default(3000),
    APP_NAME: Joi.string().required(),
    APP_VERSION: Joi.string().required(),

    APP_LOGGER_PROVIDER: Joi.string().valid('winston', 'pino').required(),
    APP_LOGGER_LEVEL: Joi.string().required(),

    OPENAI_API_KEY: Joi.string().optional(),
  });
})();
