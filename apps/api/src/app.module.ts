import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import * as redisStore from 'cache-manager-ioredis';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { NfcTagsModule } from './modules/nfc-tags/nfc-tags.module';
import { LostPetsModule } from './modules/lost-pets/lost-pets.module';
import { ScanEventsModule } from './modules/scan-events/scan-events.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { QueueModule } from './modules/queue/queue.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { UploadModule } from './modules/upload/upload.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AppThrottlerGuard } from './common/guards/throttler.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import stripeConfig from './config/stripe.config';

@Module({
  imports: [
    // ── Config (global) ────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, storageConfig, stripeConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // ── Rate limiting ──────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [
          // Very tight for auth endpoints (configured per-route with @Throttle)
          { name: 'short',  ttl: 1_000,       limit: 10   },
          // General API: 100 req/min per IP
          { name: 'medium', ttl: 60_000,       limit: 100  },
          // Sustained: 1000 req/hour per IP
          { name: 'long',   ttl: 3_600_000,    limit: 1000 },
        ],
        skipIf: (ctx) => {
          // Skip throttling for health checks
          const req = ctx.switchToHttp().getRequest();
          return req.url?.includes('/health');
        },
      }),
    }),

    // ── IORedis client (global, used via @InjectRedis()) ──────────
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single' as const,
        options: {
          host: config.get('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get('redis.password'),
        },
      }),
    }),

    // ── Redis cache (global) ───────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get('redis.host'),
        port: config.get('redis.port'),
        password: config.get('redis.password'),
        ttl: 300,
      }),
    }),

    // ── BullMQ (global connection) ─────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('redis.host'),
          port: config.get('redis.port'),
          password: config.get('redis.password'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
    }),

    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),
    ScheduleModule.forRoot(),

    // ── Feature modules ────────────────────────────────────────────
    DatabaseModule,
    QueueModule,
    GatewayModule,
    UploadModule,
    AuthModule,
    UsersModule,
    PetsModule,
    NfcTagsModule,
    LostPetsModule,
    ScanEventsModule,
    SubscriptionsModule,
    AdminModule,
    NotificationsModule,
    HealthModule,
  ],
  providers: [
    // ── Global guards (applied to every route) ─────────────────────
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AppThrottlerGuard },

    // ── Global filter (all exceptions) ────────────────────────────
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    // ── Global interceptors ────────────────────────────────────────
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
