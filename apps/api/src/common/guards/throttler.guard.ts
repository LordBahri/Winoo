import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../exceptions/api.exception';
import { ErrorCodes } from '../exceptions/error-codes';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): never {
    throw new ApiException({
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please slow down and try again.',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
