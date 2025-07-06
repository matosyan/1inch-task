import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { Environment } from './shared/types';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { json, urlencoded } from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { AppLogger } from './packages/app-logger/app-logger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: '*',
    methods: 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  const logger = app.get(AppLogger);
  const config = app.get(ConfigService);

  if (config.get<Environment>('app.env') !== Environment.PROD) {
    const docBuilder = new DocumentBuilder()
      .setTitle('1inch API')
      .setDescription('HTTP API documentation for the project')
      .setVersion(config.get('app.version'))
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, docBuilder);
    SwaggerModule.setup('/swagger', app, document, {
      explorer: false,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: '1inch API',
    });
  }

  await app.listen(config.get('app.port'));
  logger.info(`Nest application is listening on port ${config.get('app.port')}`);
}

bootstrap();
