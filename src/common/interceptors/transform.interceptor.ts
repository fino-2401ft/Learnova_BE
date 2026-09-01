import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess<T> | undefined
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccess<T> | undefined> {
    return next.handle().pipe(
      map((data) => {
        // A 204 route (logout) has no body. Wrapping undefined would turn an empty
        // response into {"success":true}, which contradicts 204.
        if (data === undefined) return undefined;

        return { success: true as const, data };
      }),
    );
  }
}
