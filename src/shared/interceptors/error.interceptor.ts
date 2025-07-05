import { catchError, Observable, throwError } from 'rxjs';
import {
  HttpStatus,
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const resource = context.getClass().name;
    // const handler = context.getHandler().name;

    return next.handle().pipe(
      catchError((error: any) => {
        if (!error.status || error.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
          // log or sentry
        }

        return throwError(() => error);
      }),
    );
  }
}
