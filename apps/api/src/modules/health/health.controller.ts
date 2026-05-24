import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly memory: MemoryHealthIndicator,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /** Full health check — used by Kubernetes readiness probe */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Service health check (DB + Redis + memory)' })
  check() {
    return this.health.check([
      // PostgreSQL
      async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' as const } };
      },
      // Redis
      async () => {
        const pong = await this.redis.ping();
        return { redis: { status: pong === 'PONG' ? ('up' as const) : ('down' as const) } };
      },
      // Heap memory ≤ 500 MB
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      // RSS memory ≤ 1 GB
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
    ]);
  }

  /** Lightweight liveness probe — only checks process is running */
  @Public()
  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe (always fast)' })
  liveness() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
