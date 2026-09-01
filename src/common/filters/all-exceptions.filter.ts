import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import {
  ErrorCode,
  ErrorCodeValue,
  defaultCodeForStatus,
} from '../constants/error-codes';
import type { ErrorResponseDto } from '../dto/error-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const { status, code, message, details } = this.normalize(exception);

    const body: ErrorResponseDto = {
      success: false,
      statusCode: status,
      code,
      message,
      ...(details ? { details } : {}),
      path: httpAdapter.getRequestUrl(request) as string,
      timestamp: new Date().toISOString(),
    };

    // 5xx is our bug and needs a stack. 4xx is the caller sending bad input —
    // logging a stack for each one drowns the real errors.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${body.path} -> ${status} ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${body.path} -> ${status} ${code}: ${message}`,
      );
    }

    httpAdapter.reply(ctx.getResponse(), body, status);
  }

  private normalize(exception: unknown): {
    status: number;
    code: ErrorCodeValue | string;
    message: string;
    details?: string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          code: defaultCodeForStatus(status),
          message: response,
        };
      }

      const payload = response as Record<string, unknown>;

      // ValidationPipe packs per-field errors into `message` as an array. Move them
      // to `details` so `message` is always one readable sentence.
      if (Array.isArray(payload.message)) {
        return {
          status,
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Request payload is invalid',
          details: payload.message as string[],
        };
      }

      return {
        // Throw sites can pick a narrower code:
        //   throw new ConflictException({ code: 'EMAIL_TAKEN', message: '...' })
        status,
        code: (payload.code as string) ?? defaultCodeForStatus(status),
        message: (payload.message as string) ?? exception.message,
      };
    }

    // Anything else is unexpected. Never echo the original text — it can carry a
    // query, a file path or a connection string. It is already in the log above.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Something went wrong on our side',
    };
  }
}
