import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Conditionally capture raw body for Stripe webhook signature verification
    rawBody: true,
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const isDev = nodeEnv === 'development';

  // ── WebSocket adapter ──────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: isDev ? false : undefined,
    }),
  );
  app.use(cookieParser(config.get('COOKIE_SECRET', 'fallback-cookie-secret')));

  // ── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins = config
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  // ── Raw body middleware (Stripe webhooks need unparsed body) ──────────────
  app.use('/api/v1/subscriptions/webhook', express.raw({ type: 'application/json' }));

  // ── API versioning + global prefix ────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Global validation pipe ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // strip undeclared fields
      forbidNonWhitelisted: false,    // don't throw on extra fields (whitelist handles it)
      transform: true,                // auto-cast to declared TS types
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,        // collect all validation errors
    }),
  );

  // ── Swagger UI ─────────────────────────────────────────────────────────────
  const swaggerDoc = new DocumentBuilder()
    .setTitle('PetID API')
    .setDescription(
      `## PetID Platform REST API v1

### Authentication
All protected endpoints require **Bearer token** in the \`Authorization\` header.
Obtain a token via \`POST /api/v1/auth/login\`.

### Rate Limits
- Auth endpoints: **5 req/min** per IP
- NFC scan endpoints: **30 req/min** per IP
- General API: **100 req/min** per IP

### Error Format
All errors follow the shape:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "statusCode": 401
  }
}
\`\`\`
`,
    )
    .setVersion('1.0')
    .setContact('PetID Support', 'https://petid.app', 'support@petid.app')
    .setLicense('Proprietary', 'https://petid.app/terms')
    .addServer(isDev ? 'http://localhost:3000' : 'https://api.petid.app', nodeEnv)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addCookieAuth('refresh_token')
    .addTag('Auth', 'Registration, login, token refresh, password reset')
    .addTag('Users', 'User profile management')
    .addTag('Pets', 'Pet registration and management')
    .addTag('NFC Tags', 'Tag linking, public lookup, scan events')
    .addTag('Lost Pets', 'Lost/found reports and sighting submissions')
    .addTag('Scan Events', 'Scan history and statistics')
    .addTag('Subscriptions', 'Stripe billing and plan management')
    .addTag('Upload', 'Image upload')
    .addTag('Admin', 'Platform administration (ADMIN+ role required)')
    .addTag('Health', 'Service health and readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
    customSiteTitle: 'PetID API Docs',
    customfavIcon: 'https://petid.app/favicon.ico',
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  logger.log(`🐾 PetID API [${nodeEnv}] running on :${port}`);
  logger.log(`📚 Swagger UI → http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', err);
  process.exit(1);
});
