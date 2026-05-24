import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'warn' }, { emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PostgreSQL connected');
    this.registerMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Automatically exclude soft-deleted records from all findMany / findFirst / count
   * queries on models that have a `deletedAt` column.
   */
  private registerMiddleware() {
    const SOFT_DELETE_MODELS = new Set(['User', 'Pet']);

    this.$use(async (params: Prisma.MiddlewareParams, next) => {
      if (!SOFT_DELETE_MODELS.has(params.model ?? '')) return next(params);

      if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'count') {
        params.args ??= {};
        params.args.where ??= {};
        // Only inject if caller has not explicitly set deletedAt
        if (!('deletedAt' in params.args.where)) {
          params.args.where.deletedAt = null;
        }
      }

      return next(params);
    });

    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        this.logger.verbose(`Query (${e.duration}ms): ${e.query}`);
      });
    }
  }
}
