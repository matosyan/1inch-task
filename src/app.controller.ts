import { AppService } from './app.service';
import { Public } from './shared/decorators';
import { ApiResponse } from '@nestjs/swagger';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Public()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A simple string which is "alive"',
    content: { default: { example: 'alive' } },
  })
  @Throttle({
    'health-check': {
      ttl: 60000, // 1 minute
      limit: 300, // 300 requests per minute - very permissive for health checks
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('/heartbeat')
  getPulse() {
    return this.appService.getPulse();
  }
}
