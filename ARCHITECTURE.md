# PetID Platform — Enterprise Architecture

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Database Architecture](#4-database-architecture)
5. [API Design](#5-api-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [NFC/RFID Implementation](#7-nfcrfid-implementation)
8. [Mobile App Architecture](#8-mobile-app-architecture)
9. [Admin Dashboard Architecture](#9-admin-dashboard-architecture)
10. [Real-time & Notifications](#10-real-time--notifications)
11. [Multi-role Permission System](#11-multi-role-permission-system)
12. [Infrastructure & DevOps](#12-infrastructure--devops)
13. [Scalability Considerations](#13-scalability-considerations)
14. [Security Considerations](#14-security-considerations)
15. [SaaS Monetization & Plans](#15-saas-monetization--plans)
16. [Future Extensibility](#16-future-extensibility)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PetID Platform                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  Mobile App  │    │  Web Admin   │    │  Public Scan Page    │  │
│  │ (React Native│    │  (Next.js)   │    │  (Next.js SSR)       │  │
│  │  + Expo)     │    │              │    │  petid.app/scan/:uid │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│         │                  │                        │              │
│         └──────────────────┼────────────────────────┘              │
│                            │ HTTPS / WSS                           │
│                     ┌──────▼──────┐                                │
│                     │  API Gateway │ (Nginx + Rate Limiting)       │
│                     └──────┬──────┘                                │
│                            │                                       │
│              ┌─────────────┼─────────────┐                        │
│              │             │             │                        │
│       ┌──────▼─────┐ ┌─────▼────┐ ┌─────▼──────┐                │
│       │  NestJS    │ │  NestJS  │ │  NestJS    │                │
│       │  API #1    │ │  API #2  │ │  API #3    │  (Horizontal)  │
│       └──────┬─────┘ └─────┬────┘ └─────┬──────┘                │
│              └─────────────┼─────────────┘                        │
│                            │                                       │
│         ┌──────────────────┼──────────────────┐                   │
│         │                  │                  │                   │
│  ┌──────▼──────┐   ┌───────▼──────┐  ┌───────▼──────┐           │
│  │ PostgreSQL  │   │    Redis     │  │   S3 / R2    │           │
│  │ (Primary +  │   │  (Cache +    │  │  (Pet Photos │           │
│  │  Replicas)  │   │   Sessions + │  │   + Docs)    │           │
│  └─────────────┘   │   PubSub)    │  └──────────────┘           │
│                    └──────────────┘                               │
│                                                                     │
│         ┌────────────────────────────────────┐                    │
│         │           Background Jobs          │                    │
│         │  BullMQ (Email, Push, Cleanup)     │                    │
│         └────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Data Flow — NFC Scan

```
Physical NFC Tag (NTAG215)
        │
        │  User taps phone on tag
        ▼
  Phone NFC Reader
  Reads NDEF URL:
  https://petid.app/scan/{tagUid}
        │
        ├─── (Mobile App installed) ──► Deep link → In-app pet profile
        │
        └─── (No app / Web browser) ──► SSR Page → Public pet profile
                                               │
                                               ▼
                                      POST /scan-events
                                      { tagUid, lat, lng }
                                               │
                                               ▼
                                      Lookup pet by tagUid
                                               │
                                               ▼
                                      Push notification → Owner
                                      "Your pet was just scanned at [location]"
```

---

## 2. Tech Stack

### Backend API
| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Mature, large ecosystem, async I/O |
| Language | TypeScript 5 | Type safety, maintainability |
| Framework | NestJS 10 | Enterprise-grade, DI, modular, decorators |
| ORM | Prisma 5 | Type-safe queries, migrations, schema-first |
| Database | PostgreSQL 16 | ACID, JSON support, PostGIS for geo queries |
| Cache / Sessions | Redis 7 | Fast key-value, pub/sub, BullMQ backend |
| Job Queue | BullMQ | Reliable background jobs with retry |
| Real-time | Socket.io | Lost pet alerts, live scan events |
| Auth | Passport.js + JWT | Flexible strategy pattern |
| Payments | Stripe | Industry standard, subscription billing |
| Email | Resend (API) | Developer-friendly transactional email |
| Push Notifications | Firebase FCM | Cross-platform mobile push |
| File Storage | AWS S3 / Cloudflare R2 | Scalable object storage |
| Validation | Zod + class-validator | Dual-layer validation |

### Mobile App
| Layer | Technology | Rationale |
|---|---|---|
| Framework | React Native 0.74+ | Cross-platform (iOS + Android) |
| Toolchain | Expo SDK 51+ | Managed workflow, OTA updates |
| Language | TypeScript | Shared types with backend |
| Navigation | Expo Router v3 | File-based routing |
| State | Zustand | Lightweight, no boilerplate |
| Server State | TanStack Query v5 | Caching, invalidation, optimistic UI |
| NFC | react-native-nfc-manager | Android + iOS NFC read/write |
| Maps | react-native-maps | Lost pet location display |
| Camera | expo-camera | Pet photo capture |
| Styling | NativeWind (Tailwind) | Consistent design system |
| Animations | Reanimated 3 | Fluid, 60fps animations |
| Forms | React Hook Form + Zod | Validated, performant forms |

### Web Admin Dashboard
| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG, file routing, Server Actions |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS 3 + shadcn/ui | Rapid UI development |
| Charts | Recharts | Flexible, composable charts |
| Tables | TanStack Table v8 | Headless, feature-rich |
| State | Zustand + TanStack Query | Client + server state |
| Auth | NextAuth.js v5 | Session management |
| Forms | React Hook Form + Zod | Validated forms |
| Maps | Leaflet.js + react-leaflet | Open-source map |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (EKS / GKE) |
| CI/CD | GitHub Actions |
| IaC | Terraform |
| DNS / CDN | Cloudflare |
| Cloud Provider | AWS (primary) |
| Monitoring | Grafana + Prometheus |
| Logging | Loki + Grafana |
| Error Tracking | Sentry |
| APM | OpenTelemetry |
| Secret Management | AWS Secrets Manager |

---

## 3. Monorepo Structure

```
petid/                          ← root workspace (pnpm workspaces)
├── apps/
│   ├── api/                    ← NestJS backend API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       ← JWT, OAuth, guards
│   │   │   │   ├── users/      ← user CRUD, profile
│   │   │   │   ├── pets/       ← pet registration, profiles
│   │   │   │   ├── nfc-tags/   ← tag provisioning, linking
│   │   │   │   ├── lost-pets/  ← lost/found workflow
│   │   │   │   ├── scan-events/← scan logging, geo lookup
│   │   │   │   ├── subscriptions/ ← Stripe billing
│   │   │   │   ├── admin/      ← admin-only endpoints
│   │   │   │   ├── notifications/ ← push + email
│   │   │   │   └── health/     ← /health, /metrics
│   │   │   ├── common/
│   │   │   │   ├── guards/     ← JWT, roles, throttle
│   │   │   │   ├── decorators/ ← @CurrentUser, @Roles, @Public
│   │   │   │   ├── filters/    ← global exception filter
│   │   │   │   ├── interceptors/ ← logging, transform
│   │   │   │   └── pipes/      ← validation pipe
│   │   │   ├── database/       ← PrismaService
│   │   │   └── config/         ← typed env config
│   │   ├── prisma/
│   │   │   ├── schema.prisma   ← full DB schema
│   │   │   ├── migrations/     ← versioned migrations
│   │   │   └── seed.ts         ← dev seed data
│   │   ├── test/               ← e2e tests
│   │   └── Dockerfile
│   │
│   ├── mobile/                 ← Expo React Native app
│   │   ├── src/
│   │   │   ├── app/            ← Expo Router screens
│   │   │   │   ├── (auth)/     ← login, register, onboarding
│   │   │   │   ├── (tabs)/     ← home, pets, scanner, lost, profile
│   │   │   │   └── scan/[uid]/ ← public pet scan page (deep link)
│   │   │   ├── components/
│   │   │   ├── stores/         ← Zustand stores
│   │   │   ├── services/       ← API client, NFC service
│   │   │   ├── hooks/          ← custom hooks
│   │   │   └── utils/
│   │   └── app.json
│   │
│   └── web/                    ← Next.js admin dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/     ← login page
│       │   │   ├── (dashboard)/
│       │   │   │   ├── page.tsx         ← overview
│       │   │   │   ├── users/
│       │   │   │   ├── pets/
│       │   │   │   ├── tags/
│       │   │   │   ├── lost-pets/
│       │   │   │   ├── analytics/
│       │   │   │   └── settings/
│       │   │   └── api/        ← Next.js API routes (proxy/BFF)
│       │   ├── components/
│       │   ├── lib/
│       │   └── hooks/
│       └── Dockerfile
│
├── packages/
│   ├── shared/                 ← shared TypeScript types & utils
│   │   └── src/
│   │       ├── types/          ← Pet, User, Tag, etc. (shared DTOs)
│   │       ├── utils/          ← date, format, validation helpers
│   │       └── constants/      ← roles, status enums
│   ├── ui/                     ← shared web UI components
│   └── config/                 ← shared ESLint, TSConfig, Tailwind
│
├── infra/
│   ├── docker/                 ← Dockerfiles, nginx config
│   ├── k8s/                    ← Kubernetes manifests
│   └── terraform/              ← IaC for AWS resources
│
├── docs/                       ← architecture docs, ADRs
├── docker-compose.yml          ← production-like local stack
├── docker-compose.dev.yml      ← hot-reload dev stack
├── turbo.json                  ← Turborepo pipeline config
└── package.json                ← root workspace
```

---

## 4. Database Architecture

### Entity Relationship Diagram

```
users ──────────────────────────────────────────────────────┐
  │ id (uuid)                                               │
  │ email (unique)                                          │
  │ password_hash                                           │
  │ role: SUPER_ADMIN|ADMIN|VET|SHELTER|PET_OWNER           │
  │ name, phone, avatar_url                                 │
  │ is_email_verified                                       │
  │ stripe_customer_id                                      │
  │ fcm_token (push notifications)                          │
  │ last_login_at, created_at, updated_at                   │
  │                                                         │
  │ 1:N                                                     │
  ▼                                                         │
pets ──────────────────────────────┐                        │
  │ id (uuid)                      │                        │
  │ owner_id → users.id            │                        │
  │ name, species, breed           │                        │
  │ color, weight_kg               │                        │
  │ date_of_birth                  │                        │
  │ gender: MALE|FEMALE|UNKNOWN    │                        │
  │ microchip_number               │                        │
  │ profile_image_url              │                        │
  │ is_lost (bool)                 │                        │
  │ lost_at, found_at              │                        │
  │ visibility: PUBLIC|PRIVATE     │                        │
  │ emergency_contact (json)       │                        │
  │ created_at, updated_at         │                        │
  │                                │                        │
  │ 1:1                            │ 1:N                    │
  ▼                                ▼                        │
nfc_tags                     health_records                 │
  id (uuid)                    id (uuid)                    │
  tag_uid (unique)             pet_id → pets.id             │
  pet_id → pets.id (unique)    vet_id → users.id (nullable) │
  tag_type: NFC|RFID           record_type: VAX|EXAM|...    │
  is_active                    date, title, notes           │
  activated_at                 attachments (json array)     │
  last_scanned_at              created_at                   │
  scan_count                                                │
  created_at, updated_at            1:N                     │
  │                            ▼                            │
  │ 1:N                   vaccine_records                   │
  ▼                            ...                          │
scan_events                                                  │
  id (uuid)                                                 │
  tag_uid                                                   │
  pet_id (resolved at scan time)                            │
  scanner_user_id → users.id (nullable)                     │
  latitude, longitude                                       │
  city, country (reverse geocoded async)                    │
  device_type, ip_address                                   │
  created_at                                                │
                                                            │
lost_pet_reports ──────────────────────────────────────────┘
  id (uuid)
  pet_id → pets.id
  reported_by → users.id
  last_seen_latitude, last_seen_longitude
  last_seen_address
  last_seen_at
  description
  reward_amount, reward_currency
  status: ACTIVE|FOUND|CLOSED|EXPIRED
  contact_phone, contact_email
  images (json array)
  created_at, updated_at

      1:N
      ▼
lost_pet_sightings
  id (uuid)
  report_id → lost_pet_reports.id
  reporter_name, reporter_contact
  latitude, longitude
  address
  sighted_at
  notes, image_url
  created_at

organizations
  id (uuid)
  name, type: VET_CLINIC|SHELTER|RESCUE|BREEDER
  address, city, country
  phone, email, website
  is_verified
  created_at

user_organizations (many:many)
  user_id → users.id
  org_id → organizations.id
  role: OWNER|STAFF

subscription_plans
  id (uuid)
  name: FREE|BASIC|PREMIUM|ENTERPRISE
  price_monthly, price_yearly
  max_pets, max_tags
  features (jsonb)
  stripe_price_id_monthly
  stripe_price_id_yearly
  is_active

user_subscriptions
  id (uuid)
  user_id → users.id (unique)
  plan_id → subscription_plans.id
  status: ACTIVE|PAST_DUE|CANCELED|TRIALING
  current_period_start, current_period_end
  stripe_subscription_id
  cancel_at_period_end
  created_at, updated_at

audit_logs
  id (uuid)
  actor_id → users.id
  action (string)
  resource_type, resource_id
  old_value (jsonb), new_value (jsonb)
  ip_address
  created_at
```

### Key Database Design Decisions

- **UUID primary keys** — avoids enumeration attacks, safe for distributed systems
- **Soft deletes** via `deleted_at` on users and pets — GDPR & data recovery
- **PostGIS extension** — enables fast geospatial queries for "lost pets near me"
- **JSONB columns** — flexible metadata (emergency_contact, features, attachments) without schema migration
- **Partial indexes** — `WHERE is_lost = true` index on pets for instant lost-pet queries
- **audit_logs** — append-only compliance log (never update/delete rows)
- **tag_uid is NFC chip UID** — not generated by us, immutable hardware identifier

---

## 5. API Design

### Base URL: `https://api.petid.app/v1`

### Authentication Endpoints
```
POST   /auth/register               Register with email + password
POST   /auth/login                  Returns access_token + refresh_token (httpOnly cookie)
POST   /auth/refresh                Rotate refresh token
POST   /auth/logout                 Invalidate refresh token
POST   /auth/forgot-password        Send reset email
POST   /auth/reset-password         Consume OTP + set new password
POST   /auth/verify-email/:token    Email verification
POST   /auth/oauth/google           Google OAuth2 callback
POST   /auth/oauth/apple            Apple Sign-In callback
```

### User Endpoints
```
GET    /users/me                    Get current user profile
PATCH  /users/me                    Update profile
DELETE /users/me                    Delete account (GDPR)
PATCH  /users/me/avatar             Upload avatar
GET    /users/me/subscription       Current subscription + usage
PUT    /users/me/fcm-token          Update push notification token
GET    /users/me/notifications      Notification history
PATCH  /users/me/notifications/read Mark notifications read
```

### Pet Endpoints
```
GET    /pets                        List user's pets
POST   /pets                        Register new pet
GET    /pets/:id                    Get pet details
PATCH  /pets/:id                    Update pet info
DELETE /pets/:id                    Delete pet
POST   /pets/:id/photo              Upload pet photo
POST   /pets/:id/mark-lost          Report pet as lost
POST   /pets/:id/mark-found         Mark pet as found
GET    /pets/:id/scan-events        Scan history for this pet
GET    /pets/:id/health-records     Health records list
POST   /pets/:id/health-records     Add health record
GET    /pets/:id/health-records/:rid Get single record
PATCH  /pets/:id/health-records/:rid Update record
DELETE /pets/:id/health-records/:rid Delete record
POST   /pets/:id/share              Generate shareable profile link
```

### NFC Tag Endpoints
```
GET    /tags/:uid                   PUBLIC — resolve tag → pet public profile
POST   /tags/link                   Link tag UID to a pet (auth required)
DELETE /tags/:uid/unlink            Unlink tag from pet
POST   /tags/scan-event             PUBLIC — log scan with location
GET    /tags                        List user's registered tags
GET    /tags/:uid/history           Scan history for a tag
```

### Lost Pets Endpoints
```
GET    /lost-pets                   PUBLIC — list active lost reports (filterable by geo)
GET    /lost-pets/:id               PUBLIC — single lost pet report
POST   /lost-pets/:id/sightings     PUBLIC — report a sighting
GET    /lost-pets/nearby?lat&lng&r  PUBLIC — lost pets within radius (PostGIS)
GET    /lost-pets/mine              Owner's own reports
PATCH  /lost-pets/:id               Update report
DELETE /lost-pets/:id               Close/delete report
```

### Subscription Endpoints
```
GET    /subscriptions/plans         List available plans
POST   /subscriptions/checkout      Create Stripe Checkout session
POST   /subscriptions/portal        Stripe Customer Portal URL
POST   /subscriptions/webhook       Stripe webhook handler
```

### Admin Endpoints (role: ADMIN | SUPER_ADMIN)
```
GET    /admin/stats                 Platform-wide stats
GET    /admin/users                 Paginated user list
GET    /admin/users/:id             User detail
PATCH  /admin/users/:id             Update user (role, ban)
GET    /admin/pets                  All pets (filterable)
GET    /admin/tags                  All tags (filterable)
GET    /admin/scan-events           All scan events (geo filterable)
GET    /admin/lost-pets             All reports
GET    /admin/subscriptions         Revenue / subscription stats
POST   /admin/tags/provision        Bulk provision NFC tags
GET    /admin/audit-logs            Audit trail
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "PET_NOT_FOUND",
    "message": "Pet with id abc-123 was not found",
    "statusCode": 404
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## 6. Authentication & Authorization

### Token Strategy

```
┌─────────────────────────────────────────────────────┐
│                   Authentication Flow               │
│                                                     │
│  Login / OAuth                                      │
│       │                                             │
│       ▼                                             │
│  Validate credentials                               │
│       │                                             │
│       ▼                                             │
│  Generate:                                          │
│  ┌─────────────────────────────────┐               │
│  │  access_token (JWT, 15 min)     │  → Response   │
│  │  Payload: { sub, email, role,   │    header /   │
│  │    planId, jti }                │    body       │
│  └─────────────────────────────────┘               │
│  ┌─────────────────────────────────┐               │
│  │  refresh_token (opaque, 30 days)│  → httpOnly   │
│  │  Stored in Redis:               │    Secure     │
│  │  key: refresh:{userId}:{jti}    │    SameSite   │
│  │  value: { rotatedAt }           │    cookie     │
│  └─────────────────────────────────┘               │
│                                                     │
│  Every API request:                                 │
│  Authorization: Bearer <access_token>               │
│       │                                             │
│       ▼                                             │
│  JwtAuthGuard → verifies signature + expiry        │
│  RolesGuard   → checks role against @Roles()       │
│  PlanGuard    → checks feature flags vs plan       │
└─────────────────────────────────────────────────────┘
```

### Refresh Token Rotation
- Refresh token is rotated on every use (sliding window)
- Old token is immediately invalidated in Redis
- Detecting reuse of an invalidated token → revoke entire family (breach detected)

### NFC Public Access
- Tag scanning endpoints are `@Public()` — no auth required
- Rate limited: 30 scans/min per IP
- Geo data is collected (with user consent banner on web)

### OAuth2 Flow (Google / Apple)
```
App → OAuth Provider → Callback with code
                          │
                    Exchange for profile
                          │
                    Upsert user in DB
                    (create if new, link if existing email)
                          │
                    Issue PetID JWT pair
```

---

## 7. NFC/RFID Implementation

### Tag Specification

| Property | Value |
|---|---|
| Chip type | NTAG215 or NTAG216 |
| Memory | 504 bytes (NTAG215) / 888 bytes (NTAG216) |
| Read range | 0–10 cm |
| Protocol | ISO 14443-A (NFC Forum Type 2) |
| Operating freq | 13.56 MHz |
| Durability | IP67 rated enclosure for collar |
| Unit cost | ~$0.30–$0.60 per tag |

### NDEF Record Format
Each tag is programmed with a single NDEF URL record:
```
https://petid.app/scan/{tagUid}
```
`tagUid` = the chip's immutable UID (7-byte hex, e.g. `04:A3:2B:F1:C8:44:80`)

### Tag Lifecycle
```
[Tag manufactured] → UID is read and stored in nfc_tags table (status: UNLINKED)
        │
        │  Owner scans tag in app
        ▼
[Registration flow]
  App reads tag UID via NFC
  App calls POST /tags/link { tagUid, petId }
  Backend links tag → pet (status: ACTIVE)
        │
        │  Anyone scans tag
        ▼
[Scan flow]
  Phone reads NDEF URL → opens https://petid.app/scan/{tagUid}
  If PetID app installed → deep link to in-app pet profile
  If no app → SSR web page shows:
    - Pet name + photo
    - Species/breed
    - "This pet is LOST" banner (if is_lost=true)
    - Owner first name + masked phone (e.g., "+216 *** *** 78")
    - "I found this pet" button → creates sighting report
  POST /tags/scan-event { tagUid, lat, lng }
  Async: reverse geocode → store city/country
  Async: push notification to owner
```

### Anti-cloning Strategy
- Tag UID is read-only hardware value (cannot be spoofed on standard NFC)
- Every scan event is logged with IP + timestamp
- Anomaly detection: >10 scans/hour from different IPs → alert admin
- Optional: NTAG213/215 password-protect the write lock after initial programming

### Mobile NFC Implementation
```typescript
// React Native — reading tag
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

async function readTag(): Promise<string> {
  await NfcManager.requestTechnology(NfcTech.Ndef);
  const tag = await NfcManager.getTag();
  // Extract UID from tag.id (byte array → hex string)
  const uid = tag.id.map(b => b.toString(16).padStart(2,'0')).join(':');
  return uid;
}

// Writing NDEF URL to new tag (provisioning mode)
async function writeTagUrl(uid: string): Promise<void> {
  const url = `https://petid.app/scan/${uid}`;
  const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
  await NfcManager.ndefHandler.writeNdefMessage(bytes);
}
```

### Batch Tag Provisioning (Admin)
- Admin uploads CSV of tag UIDs
- System pre-registers all UIDs in `nfc_tags` table (status: UNLINKED)
- Physical tags are pre-programmed with NDEF URL before shipping
- Owner receives tag in collar packaging → scans to activate

---

## 8. Mobile App Architecture

### Screen Map
```
Onboarding (first-launch only)
├── Welcome / Value Prop
├── Permissions (Location, NFC, Notifications, Camera)
└── Login / Register

(Auth Stack)
├── Login
├── Register
├── Forgot Password
└── Verify Email

(Main Tabs)
├── Home Tab
│   ├── My Pets list
│   ├── Quick-scan button (floating)
│   └── Active lost pet nearby banner
│
├── Scanner Tab
│   ├── NFC Scan mode (tap to scan)
│   ├── Scan result screen (pet profile)
│   └── "Report found pet" flow
│
├── Lost Pets Tab (map view)
│   ├── Map with lost pet pins (react-native-maps)
│   ├── Filter (species, radius)
│   └── Lost pet detail sheet
│
├── My Pets Tab
│   ├── Pet list
│   ├── Add pet flow
│   │   ├── Pet info form
│   │   ├── Photo upload
│   │   └── NFC tag linking
│   └── Pet detail
│       ├── Profile
│       ├── Health records
│       ├── Scan history map
│       └── Mark as lost / found
│
└── Profile Tab
    ├── Account settings
    ├── Subscription plan
    ├── Notification preferences
    └── Logout
```

### State Management
```typescript
// stores/auth.store.ts
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// stores/pets.store.ts
interface PetsStore {
  pets: Pet[];
  selectedPetId: string | null;
  isLoading: boolean;
}

// stores/scan.store.ts  
interface ScanStore {
  isScanning: boolean;
  lastScannedTag: string | null;
  scannedPet: PublicPetProfile | null;
  startScan: () => Promise<void>;
  stopScan: () => void;
}
```

### Offline Strategy
- TanStack Query caches all pet data locally (staleTime: 5min)
- React Native AsyncStorage as persistence adapter
- Optimistic updates for pet status changes
- Queue failed scan-event posts → retry on reconnect (NetInfo)

### OTA Updates
- Expo EAS Update for JS bundle updates (no app store review)
- Critical security patches can be shipped in < 5 minutes
- Version channels: production / staging / development

---

## 9. Admin Dashboard Architecture

### Page Structure
```
/login                          ← Auth gate
/(dashboard)
  /                             ← Overview (KPI cards + charts)
  /users                        ← User management table
  /users/[id]                   ← User detail + edit
  /pets                         ← All pets table
  /pets/[id]                    ← Pet detail
  /tags                         ← NFC tag inventory
  /tags/provision               ← Bulk provision flow
  /lost-pets                    ← Active reports map + table
  /scan-events                  ← Real-time scan event feed
  /analytics                    ← Revenue, growth, geo charts
  /subscriptions                ← MRR, churn, plan distribution
  /settings                     ← Platform config, email templates
  /audit-logs                   ← Immutable audit trail
```

### Key Dashboard Components
- **KPI Cards**: Total users, active pets, NFC tags, MRR
- **Live Feed**: WebSocket-connected scan event stream
- **Geo Heatmap**: Tag scan density by location (Leaflet.js)
- **Lost Pets Map**: Real-time lost pet pins
- **Revenue Charts**: MRR, churn rate, plan distribution (Recharts)
- **Data Tables**: TanStack Table with server-side pagination, sort, filter
- **Audit Log Viewer**: Immutable, filterable by actor/resource/action

### Real-time Admin Features
```typescript
// Socket.io client in dashboard
socket.on('scan_event', (event: ScanEventDto) => {
  // Append to live feed, increment counter
  queryClient.invalidateQueries(['scan-events']);
});

socket.on('lost_pet_report', (report: LostPetReportDto) => {
  // Show toast notification, update map
});
```

---

## 10. Real-time & Notifications

### Socket.io Rooms
```
room: user:{userId}         → personal events (scan alert, sighting found)
room: admin                 → all scan events (admin live feed)
room: lost-pets:{city}      → lost pet alerts for a city
```

### Push Notification Events
| Trigger | Recipient | Message |
|---|---|---|
| Pet's NFC tag scanned | Pet owner | "Buddy was just scanned at [city]" |
| Lost pet sighting reported | Pet owner | "Someone spotted Max near [address]!" |
| Pet marked as found | Followers | "Buddy has been found! 🎉" |
| Subscription expiring | User | "Your Premium plan expires in 3 days" |
| New lost pet nearby | Opted-in users | "Lost pet nearby: golden retriever, 2km" |

### Notification Architecture
```
Event fires (scan, sighting, etc.)
        │
        ▼
BullMQ notification queue
        │
        ├──► Socket.io emit (real-time, in-app)
        │
        └──► Firebase FCM (push, if app in background)
                  │
                  ├──► iOS APNs
                  └──► Android FCM
```

---

## 11. Multi-role Permission System

### Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform access, can manage admins |
| `ADMIN` | Manage users, pets, tags, view analytics |
| `VET` | View/add health records for linked pets |
| `SHELTER` | Create/manage lost pet reports, view public pet profiles |
| `PET_OWNER` | Manage own pets, own tags, own records |
| `PUBLIC` | Scan tags (no auth), view lost pets, report sightings |

### Permission Matrix

| Resource | SUPER_ADMIN | ADMIN | VET | SHELTER | PET_OWNER | PUBLIC |
|---|---|---|---|---|---|---|
| All users | R/W | R/W | - | - | - | - |
| Own user | R/W | R/W | R/W | R/W | R/W | - |
| All pets | R/W | R/W | R | R | - | - |
| Own pets | R/W | R/W | R | - | R/W | - |
| Linked pets (vet) | R/W | R/W | R/W | - | - | - |
| All NFC tags | R/W | R/W | - | - | - | - |
| Own NFC tags | R/W | R/W | - | - | R/W | - |
| Tag scan | R/W | R/W | R | R | R | R |
| Health records | R/W | R/W | R/W | - | R/W | - |
| Lost pet reports | R/W | R/W | R | R/W | R/W | R |
| Sightings | R/W | R/W | - | R/W | R | R/W |
| Analytics | R/W | R/W | - | - | - | - |
| Audit logs | R/W | R | - | - | - | - |
| Subscriptions | R/W | R | - | - | R | - |

### NestJS Implementation
```typescript
// @Roles() decorator + RolesGuard
@Get('/admin/users')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async listUsers() { ... }

// Resource-level ownership check
@Get('/pets/:id')
@UseGuards(JwtAuthGuard, PetOwnerGuard)  // verifies owner OR admin
async getPet(@Param('id') id: string) { ... }
```

---

## 12. Infrastructure & DevOps

### Docker Compose (local dev)
Services: api, web, mobile (Metro), postgres, redis, mailhog (dev email), minio (S3)

### Kubernetes Production Architecture
```
Namespace: petid-production
├── Deployments:
│   ├── api         (3+ replicas, HPA min:3 max:20)
│   └── web         (2+ replicas)
├── StatefulSets:
│   ├── postgres    (primary + 2 read replicas via Patroni)
│   └── redis       (cluster mode)
├── Services + Ingress (nginx-ingress + cert-manager)
├── ConfigMaps + Secrets (sealed-secrets)
├── HorizontalPodAutoscaler (CPU 60%, memory 70%)
└── PodDisruptionBudget (min 2 available)
```

### CI/CD Pipeline
```yaml
# GitHub Actions pipeline
on: push to main/staging

jobs:
  test:        → pnpm test (unit + e2e)
  lint:        → ESLint + TypeScript check
  build:       → Docker build + push to ECR
  migrate:     → prisma migrate deploy (staging)
  deploy:      → kubectl rollout (zero-downtime)
  notify:      → Slack notification
```

### Database Backup Strategy
- Continuous WAL archiving to S3
- Daily pg_dump snapshots retained 30 days
- Point-in-time recovery (PITR) to within 5 minutes
- Monthly restore drills

---

## 13. Scalability Considerations

### Horizontal Scaling
- **API**: Stateless NestJS instances behind load balancer. All state in Redis/Postgres.
- **WebSockets**: Redis pub/sub adapter for Socket.io across multiple API instances
- **Database**: Read replicas for all SELECT queries (Prisma read replicas)
- **Jobs**: BullMQ workers scale independently from API servers

### Caching Strategy
```
Layer 1 (In-process)  → NestJS CacheInterceptor, 30s TTL
  └── Public pet profiles, plan list, tag lookup

Layer 2 (Redis)       → TanStack Query server hydration, 5min TTL
  └── User subscriptions, pet lists, scan stats

Layer 3 (CDN)         → Cloudflare cache, 24h TTL
  └── Pet photos (S3), static assets, public scan pages
```

### Database Optimization
- Partial index: `WHERE is_lost = true` on pets (few rows, hot query)
- PostGIS index on scan_events(location) for geo queries
- BRIN index on created_at columns (append-only tables)
- Connection pooling: PgBouncer (transaction mode, 100 → 10000 connections)
- Materialized view for analytics aggregates (refreshed hourly)

### CDN & Asset Pipeline
- Pet photos: uploaded to S3 → served via Cloudflare CDN
- Image variants generated on upload: thumbnail (150x150), card (400x400), full (1200x1200)
- AVIF + WebP with JPEG fallback

---

## 14. Security Considerations

### API Security
- **Rate limiting**: 100 req/min per IP (general), 5 req/min (auth endpoints), 30/min (NFC scan)
- **Helmet.js**: X-Frame-Options, X-Content-Type-Options, HSTS, CSP
- **CORS**: Allowlist of known origins only
- **Input validation**: Zod schemas on all endpoints — strip unknown fields
- **SQL injection**: Fully mitigated via Prisma parameterized queries
- **Request signing**: Stripe webhook signature verification

### Authentication Security
- Passwords: bcrypt (cost factor 12)
- JWT secrets: 256-bit random, rotated every 90 days
- Refresh token: opaque random string, stored as bcrypt hash in Redis
- 2FA (TOTP) for ADMIN+ roles (Google Authenticator compatible)
- Account lockout: 5 failed logins → 15-minute lockout

### Data Security
- **Encryption at rest**: AWS RDS encrypted (AES-256), S3 SSE-S3
- **Encryption in transit**: TLS 1.3 enforced everywhere
- **PII minimization**: Public scan page shows only first name + masked phone
- **Data isolation**: Row-level security (owners see only their pets)

### GDPR Compliance
- Right to access: `GET /users/me/export` → full data dump (JSON/PDF)
- Right to erasure: `DELETE /users/me` → soft-delete + async data scrub job
- Consent tracking for location data on scan events
- Privacy policy version tracking per user
- Data Processing Agreement (DPA) for B2B customers

### Infrastructure Security
- Private subnets for RDS and Redis (no public access)
- WAF rules (AWS WAF): SQL injection, XSS, bad bots
- Secrets in AWS Secrets Manager (never in code/env files)
- Dependency scanning: Dependabot + Snyk
- Container scanning: Trivy in CI pipeline
- Penetration testing: annual third-party pentest

---

## 15. SaaS Monetization & Plans

| Feature | Free | Basic ($9/mo) | Premium ($19/mo) | Enterprise |
|---|---|---|---|---|
| Pets | 1 | 3 | Unlimited | Unlimited |
| NFC tags | 1 | 3 | Unlimited | Unlimited |
| Health records | 10 | Unlimited | Unlimited | Unlimited |
| Scan notifications | ✓ | ✓ | ✓ | ✓ |
| Scan history | 7 days | 30 days | Forever | Forever |
| Lost pet alerts radius | 10km | 25km | 100km | Custom |
| Priority lost pet listing | - | - | ✓ | ✓ |
| Vet sharing | - | 1 vet | Unlimited | Unlimited |
| White-label tags | - | - | ✓ | ✓ |
| API access | - | - | - | ✓ |
| Custom subdomain | - | - | - | ✓ |
| SLA | - | - | 99.9% | 99.99% |

### B2B Opportunities
- **Vet clinics**: Staff accounts with pet health record access
- **Animal shelters**: Bulk tag provisioning + stray pet management
- **Pet stores**: Reseller tag sales + activation portal
- **Pet insurance**: Integration API for policy auto-creation on pet registration

---

## 16. Future Extensibility

### Phase 2 (6–12 months)
- **Veterinary portal**: Full vet practice management (appointments, invoices)
- **Pet health AI**: LLM-based symptom checker ("My cat hasn't eaten for 2 days...")
- **Community features**: Local pet owner forums, playdates, dog walkers
- **Insurance integration**: One-click pet insurance quote on registration
- **Microchip lookup**: Integrate with national microchip databases (ANIS, etc.)

### Phase 3 (12–24 months)
- **IoT GPS collar**: BLE + cellular GPS tracker linked to PetID account
- **Smart feeder integration**: Track feeding schedule in health records
- **Breeder marketplace**: Verified breeder profiles, litter registration
- **Pet passport**: Digital health certificate for cross-border travel (EU Pet Passport standard)
- **Partner API**: Third-party app integration (Rover, BringFido, etc.)

### Technical Extensibility
- **Multi-tenancy**: Schema-based isolation for white-label B2B customers
- **Webhook system**: Users/partners subscribe to events (pet scanned, lost report, etc.)
- **Plugin architecture**: NestJS dynamic modules for optional features
- **Multi-region**: Active-active in EU + US (GDPR compliance by region)
- **Offline-first PWA**: Progressive Web App version of admin for field workers
