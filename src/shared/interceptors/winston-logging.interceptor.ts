import { tap } from 'rxjs/operators';
import { getClientIp } from 'request-ip';
import { catchError, Observable, throwError } from 'rxjs';
import { Injectable, CallHandler, NestInterceptor, ExecutionContext, Logger } from '@nestjs/common';

@Injectable()
export class WinstonLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WinstonLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startedAt = Date.now();

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    if (req.method.trim().toLowerCase() === 'options') {
      return;
    }

    const { originalUrl, method, headers, body, user, query, params } = req;
    const ip = getClientIp(req);

    const metadata: Record<string, any> = {
      timestamp: new Date().getTime(),
      http: {
        url: originalUrl,
        status_code: res.statusCode,
        method: method.trim().toUpperCase(),
        useragent_details: {
          device: {
            family: req.device.family,
          },
        },
        headers,
        body,
      },
      usr: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
      },
      network: {
        client: { ip },
      },
      message: originalUrl,
      context: context.getClass().name,
    };

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startedAt;
        if (!res.headersSent) {
          res.setHeader('X-Response-Time', `${responseTime}ms`);
        }

        this.logger.log({
          resourceName: context.getClass().name,
          message: originalUrl,
          // http: metadata.http,
          network: metadata.network,
          timestamp: metadata.timestmap,
          // context: metadata.context,
          payload: body,
          query,
          params,
          user,
          ip,
          device: req.header('User-Agent'),
          statusCode: res.statusCode,
          duration: responseTime * 1000000,
        });
      }),
      catchError((e) => {
        const responseTime = Date.now() - startedAt;
        if (!res.headersSent) {
          res.setHeader('X-Response-Time', `${responseTime}ms`);
        }

        this.logger.error({
          resourceName: context.getClass().name,
          message: originalUrl,
          loggedObjects: {
            http: metadata.http,
            usr: metadata.usr,
            timestamp: metadata.timestmap,
            context: metadata.context,
            payload: body,
            query,
            params,
            user,
            ip,
            headers,
            device: req.header('User-Agent'),
            statusCode: e.status,
            stack: e.stack,
            duration: responseTime * 1000000,
          },
        });

        return throwError(() => e);
      }),
    );
  }
}
