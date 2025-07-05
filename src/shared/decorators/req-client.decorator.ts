import { ExpressRequest } from '../interfaces';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ReqClient = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request: ExpressRequest = ctx.switchToHttp().getRequest();
  return request.client;
});
