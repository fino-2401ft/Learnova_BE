import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

import { ErrorCode, ErrorCodeValue } from '../constants/error-codes';
import type { ErrorResponseDto } from '../dto/error-response.dto';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const path = httpAdapter.getRequestUrl(request) as string;

    const { status, code, message } = this.map(exception);

    this.logger.warn(
      `${request.method} ${path} -> Prisma ${exception.code} -> ${status}`,
    );

    const body: ErrorResponseDto = {
      success: false,
      statusCode: status,
      code,
      message,
      path,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse(), body, status);
  }

  private map(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    code: ErrorCodeValue;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const fields = this.targetFields(exception);
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.DB_UNIQUE_VIOLATION,
          // Name the field so the client knows what to fix, but never the value —
          // that would turn this endpoint into an account-existence oracle.
          message: fields
            ? `A record with this ${fields} already exists`
            : 'This record already exists',
        };
      }

      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.DB_FOREIGN_KEY_VIOLATION,
          message: 'Referenced record does not exist',
        };

      // Delete blocked by onDelete: Restrict.
      case 'P2014':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.DB_FOREIGN_KEY_VIOLATION,
          message:
            'This record is still referenced elsewhere and cannot be deleted',
        };

      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: ErrorCode.DB_RECORD_NOT_FOUND,
          message: 'Record not found',
        };

      // Every other Prisma code is a programming or infrastructure fault, not
      // something the caller did. Report 500 and hide the detail.
      default:
        this.logger.error(
          `Unhandled Prisma code ${exception.code}`,
          exception.stack,
        );
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Something went wrong on our side',
        };
    }
  }

  /** P2002 meta.target is a column list, or an index name for hand-written indexes. */
  private targetFields(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | null {
    const target = exception.meta?.target;
    if (Array.isArray(target)) return target.join(', ');
    if (typeof target === 'string') return target;
    return null;
  }
}
