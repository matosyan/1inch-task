import { NextFunction } from 'express';
import { DeviceFamily } from '../types';
import { UAParser } from 'ua-parser-js';
import { getClientIp } from 'request-ip';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ExpressRequest, ExpressResponse } from '../interfaces';

@Injectable()
export class RequestClientMiddleware implements NestMiddleware {
  use(req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
    const userAgent = req.header('User-Agent') || null;

    req.client = {
      ip: getClientIp(req),
      agent: new UAParser(userAgent).getResult(),
    };

    req.device = {
      family: this.getDeviceFamily(req.client.agent.os.name),
    };

    next();
  }

  getDeviceFamily(osName: string) {
    const parsedOS = osName ? osName.trim().toLowerCase() : undefined;

    switch (parsedOS) {
      case DeviceFamily.IOS:
        return DeviceFamily.IOS;
      case DeviceFamily.ANDROID:
        return DeviceFamily.ANDROID;
      default:
        return DeviceFamily.WEB;
    }
  }
}
