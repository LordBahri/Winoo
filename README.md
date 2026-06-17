# PetID Platform

> Enterprise-grade NFC/RFID pet identification SaaS platform.

**Each pet wears an NFC tag on their collar. Anyone can scan it to instantly see the pet's profile and contact the owner — even if the pet is lost.**

## Architecture Overview

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design document, including:
- System architecture diagram & data flow diagrams
- Full database schema (PostgreSQL 16 + PostGIS)
- REST API endpoint reference (40+ endpoints)
- JWT authentication & token rotation strategy
- NFC/RFID implementation guide (NTAG215/216)
- Multi-role permission matrix (6 roles)
- Kubernetes deployment specs with HPA & PDB
- Security hardening & GDPR compliance plan
- SaaS subscription tiers & B2B model
- Future product roadmap (GPS collar, vet portal, AI)

## Monorepo Structure

```
apps/
  api/       NestJS 10 backend API (TypeScript + Prisma)
  mobile/    React Native + Expo SDK 51 mobile app
  web/       Next.js 14 admin dashboard
packages/
  shared/    Shared TypeScript types & constants
infra/
  docker/    Nginx config, PostgreSQL init scripts
  k8s/       Kubernetes manifests (Deployment, HPA, PDB, Ingress)
  terraform/ AWS IaC (planned)
```

## Tech Stack

| Layer | Technology |
|---|---|
| API | NestJS 10 + TypeScript + Prisma 5 |
| Database | PostgreSQL 16 + PostGIS extension |
| Cache / Queue | Redis 7 + BullMQ |
| Mobile | React Native + Expo SDK 51 |
| Web Dashboard | Next.js 14 (App Router) + shadcn/ui + Tailwind |
| NFC | NTAG215/216 + react-native-nfc-manager |
| Auth | JWT (15 min) + Refresh tokens (30 days, rotating) |
| Payments | Stripe Subscriptions |
| Storage | AWS S3 / Cloudflare R2 + sharp image variants |
| Push | Firebase FCM (iOS APNs + Android) |
| Email | Resend transactional email |
| Infra | Kubernetes (EKS) + GitHub Actions CI/CD + Terraform |
| Monitoring | Grafana + Prometheus + Loki + Sentry |

## Quick Start (Development)

```bash
# Copy environment variables
cp .env.example .env
# Edit .env — set JWT secrets at minimum

# Start infrastructure (Postgres + Redis + MinIO + Mailhog)
docker-compose up -d postgres redis minio mailhog

# Install dependencies (requires pnpm 9+)
pnpm install

# Run DB migrations + seed demo data
pnpm --filter @petid/api db:generate
pnpm --filter @petid/api db:migrate
pnpm --filter @petid/api db:seed

# Start all apps in parallel dev mode
pnpm dev
```

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:3000/api/docs |
| Admin Dashboard | http://localhost:3001 |
| MinIO Console | http://localhost:9001 |
| Mailhog (Dev email) | http://localhost:8025 |

**Default credentials (dev seed):**
- Super Admin: `admin@petid.app` / `Admin@12345`
- Demo owner: `demo@petid.app` / `Owner@12345`

## Core NFC Flow

```
Pet owner: App → "Link NFC Tag" → reads tag UID → POST /api/v1/tags/link
                                                  ↓
                                              tag linked to pet in DB

Anyone finds pet: phone tap → reads NDEF URL: https://petid.app/scan/{uid}
                                                  ↓
                                         GET /api/v1/tags/{uid}
                                                  ↓
                              Pet profile shown (name, photo, owner contact)
                                                  ↓
                              POST /api/v1/tags/scan-event (with location)
                                                  ↓
                              Push notification → owner's phone
```

## License

Proprietary — All rights reserved.