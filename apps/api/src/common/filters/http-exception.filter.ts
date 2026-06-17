import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiException } from '../exceptions/api.exception';
import { ErrorCodes } from '../exceptions/error-codes';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ── ApiException: already shaped correctly ────────────────────
    if (exception instanceof ApiException) {
      return response.status(exception.getStatus()).json({
        success: false,
        error: {
          ...(exception.getResponse() as Record<string, unknown>['error'] as any).error,
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      });
    }

    // ── NestJS built-in HTTP exceptions ──────────────────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;

      if (status >= 500) {
        this.logger.error(`${request.method} ${request.url}`, exception.stack);
      }

      return response.status(status).json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          statusCode: status,
          message: typeof res === 'string' ? res : res?.message ?? exception.message,
          ...(Array.isArray(res?.message) && { details: res.message }),
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      });
    }

    // ── Prisma known errors ───────────────────────────────────────
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        exception.code === 'P2025' ? HttpStatus.NOT_FOUND
        : exception.code === 'P2002' ? HttpStatus.CONFLICT
        : HttpStatus.UNPROCESSABLE_ENTITY;

      this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);

      return response.status(status).json({
        success: false,
        error: {
          code: exception.code === 'P2002' ? 'DB_UNIQUE_CONSTRAINT' : ErrorCodes.INTERNAL_ERROR,
          statusCode: status,
          message: this.prismaMessage(exception),
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      });
    }

    // ── Unknown / unhandled errors ────────────────────────────────
    this.logger.error(
      `Unhandled exception: ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private prismaMessage(err: Prisma.PrismaClientKnownRequestError): string {
    if (err.code === 'P2025') return 'Record not found';
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
      return `A record with this ${fields} already exists`;
    }
    return 'Database operation failed';
  }
}
