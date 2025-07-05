import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPulse() {
    return 'alive';
  }
}
