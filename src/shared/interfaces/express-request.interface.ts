import { Request } from 'express';
import { DeviceFamily } from '../types';
import { RequestClient } from './request-client.interface';

export interface ExpressRequest extends Request {
  client: RequestClient;
  device: {
    family: DeviceFamily;
  };
}
