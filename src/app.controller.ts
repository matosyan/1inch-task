import { AppService } from './app.service';
import { Public } from './shared/decorators';
import { ApiResponse } from '@nestjs/swagger';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Public()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A simple string which is "alive"',
    content: { default: { example: 'alive' } },
  })
  @HttpCode(HttpStatus.OK)
  @Get('/heartbeat')
  getPulse() {
    return this.appService.getPulse();
  }
}
