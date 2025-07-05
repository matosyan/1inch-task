import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CustomHeader = createParamDecorator((header: string, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return header ? req.header(header) : req.headers;
});
