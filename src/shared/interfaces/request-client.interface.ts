import { IResult } from 'ua-parser-js';

export interface RequestClient {
  ip: string;
  agent: IResult;
}
