import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request } from 'express';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<{ action: string; resourceType?: string }>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Only auto-audit routes decorated with @Audit()
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user as { id?: string } | undefined;
    const ip = req.ip ?? req.socket.remoteAddress;
    const ua = req.headers['user-agent'];

    const start = Date.now();

    return next.handle().pipe(
      tap((responseData) => {
        // Extract resource ID from route params or response
        const resourceId =
          req.params?.id ??
          (responseData as any)?.data?.id ??
          (responseData as any)?.id ??
          null;

        this.writeAuditLog({
          actorId: user?.id ?? null,
          action: meta.action,
          resourceType: meta.resourceType ?? this.inferResourceType(req.path),
          resourceId: String(resourceId ?? ''),
          newValue: this.sanitizeBody(req.body),
          ipAddress: ip,
          userAgent: ua,
          durationMs: Date.now() - start,
        }).catch((err) => this.logger.error('Audit write failed', err));
      }),
      catchError((err) => {
        // Log failed write attempts too (important for security audit trail)
        if (user?.id) {
          this.writeAuditLog({
            actorId: user.id,
            action: `${meta.action}.FAILED`,
            resourceType: meta.resourceType ?? this.inferResourceType(req.path),
            resourceId: req.params?.id ?? null,
            newValue: { error: err?.message ?? 'unknown' },
            ipAddress: ip,
            userAgent: ua,
            durationMs: Date.now() - start,
          }).catch(() => null);
        }
        return throwError(() => err);
      }),
    );
  }

  private async writeAuditLog(data: {
    actorId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    newValue?: unknown;
    ipAddress?: string;
    userAgent?: string;
    durationMs?: number;
  }) {
    await this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId ?? undefined,
        newValue: data.newValue ?? undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  private inferResourceType(path: string): string {
    const segments = path.split('/').filter(Boolean);
    // /api/v1/pets/xxx → 'pets'
    // /api/v1/auth/login → 'auth'
    return segments[2] ?? segments[1] ?? 'unknown';
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body || typeof body !== 'object') return {};
    // Strip sensitive fields before storing
    const { password, passwordHash, token, refreshToken, ...safe } = body as Record<string, unknown>;
    return safe;
  }
}
