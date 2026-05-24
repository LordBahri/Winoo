import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodes } from './error-codes';

export interface ApiExceptionOptions {
  code: ErrorCode;
  message: string;
  statusCode: HttpStatus;
  meta?: Record<string, unknown>;
}

/**
 * Base exception for all intentional API errors.
 * Carries a machine-readable `code` alongside the human message
 * so frontend apps can react to specific errors without parsing strings.
 */
export class ApiException extends HttpException {
  public readonly code: ErrorCode;
  public readonly meta?: Record<string, unknown>;

  constructor(options: ApiExceptionOptions) {
    super(
      {
        success: false,
        error: {
          code: options.code,
          message: options.message,
          statusCode: options.statusCode,
          ...(options.meta && { meta: options.meta }),
        },
      },
      options.statusCode,
    );
    this.code = options.code;
    this.meta = options.meta;
  }
}

// ─── Convenience factory functions ────────────────────────────────────────────

export class NotFoundException extends ApiException {
  constructor(resource: string, id?: string) {
    super({
      code: ErrorCodes.NOT_FOUND,
      message: id ? `${resource} '${id}' not found` : `${resource} not found`,
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}

export class ForbiddenException extends ApiException {
  constructor(message = 'You do not have permission to perform this action') {
    super({ code: ErrorCodes.FORBIDDEN, message, statusCode: HttpStatus.FORBIDDEN });
  }
}

export class PlanLimitException extends ApiException {
  constructor(resource: string, limit: number) {
    super({
      code: ErrorCodes.INSUFFICIENT_PLAN,
      message: `Your current plan allows a maximum of ${limit} ${resource}. Upgrade to add more.`,
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      meta: { resource, limit },
    });
  }
}

export class ConflictException extends ApiException {
  constructor(code: ErrorCode, message: string) {
    super({ code, message, statusCode: HttpStatus.CONFLICT });
  }
}

export class UnauthorizedException extends ApiException {
  constructor(code: ErrorCode, message: string) {
    super({ code, message, statusCode: HttpStatus.UNAUTHORIZED });
  }
}
