import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import configValidationSchema from './config/config.validator';
import { RequestClientMiddleware } from './shared/middlewares/request-client.middleware';

// Interceptors
import { ErrorInterceptor } from './shared/interceptors';

// Providers
import { AppService } from './app.service';
import { AppLoggerConfigService } from './shared/services';

// NestJS Modules
import { ConfigModule } from '@nestjs/config';

// Global Modules
import { AppLoggerModule } from './shared/app-logger/app-logger.module';

// General Modules
import { AuthModule } from './modules/auth/auth.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    AppLoggerModule.forRootAsync({
      useClass: AppLoggerConfigService,
    }),
    AuthModule,
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestClientMiddleware).forRoutes('*');
  }
}
