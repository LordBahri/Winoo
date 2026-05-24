/**
 * Canonical error code registry.
 * Frontend apps switch on these codes for i18n-safe error handling.
 * Format: DOMAIN_SNAKE_CASE
 */
export const ErrorCodes = {
  // ── Auth ──────────────────────────────────────────────────────────
  INVALID_CREDENTIALS:        'AUTH_001',
  EMAIL_ALREADY_EXISTS:       'AUTH_002',
  EMAIL_NOT_VERIFIED:         'AUTH_003',
  ACCOUNT_BANNED:             'AUTH_004',
  INVALID_REFRESH_TOKEN:      'AUTH_005',
  REFRESH_TOKEN_REUSE:        'AUTH_006',
  INVALID_RESET_TOKEN:        'AUTH_007',
  INVALID_VERIFY_TOKEN:       'AUTH_008',
  OAUTH_PROVIDER_MISMATCH:    'AUTH_009',

  // ── Authorization ─────────────────────────────────────────────────
  FORBIDDEN:                  'AUTHZ_001',
  INSUFFICIENT_PLAN:          'AUTHZ_002',
  RESOURCE_NOT_OWNED:         'AUTHZ_003',

  // ── Users ─────────────────────────────────────────────────────────
  USER_NOT_FOUND:             'USER_001',

  // ── Pets ──────────────────────────────────────────────────────────
  PET_NOT_FOUND:              'PET_001',
  PET_ALREADY_LOST:           'PET_002',
  PET_NOT_LOST:               'PET_003',
  PET_LIMIT_REACHED:          'PET_004',
  PET_ALREADY_HAS_TAG:        'PET_005',

  // ── NFC Tags ──────────────────────────────────────────────────────
  TAG_NOT_FOUND:              'TAG_001',
  TAG_ALREADY_LINKED:         'TAG_002',
  TAG_INACTIVE:               'TAG_003',
  TAG_LIMIT_REACHED:          'TAG_004',

  // ── Lost Reports ──────────────────────────────────────────────────
  REPORT_NOT_FOUND:           'REPORT_001',
  REPORT_INACTIVE:            'REPORT_002',

  // ── Subscriptions ─────────────────────────────────────────────────
  PLAN_NOT_FOUND:             'SUB_001',
  SUBSCRIPTION_ALREADY_ACTIVE:'SUB_002',
  STRIPE_WEBHOOK_INVALID:     'SUB_003',

  // ── Files ─────────────────────────────────────────────────────────
  FILE_TOO_LARGE:             'FILE_001',
  FILE_TYPE_NOT_ALLOWED:      'FILE_002',
  FILE_UPLOAD_FAILED:         'FILE_003',

  // ── General ───────────────────────────────────────────────────────
  VALIDATION_ERROR:           'GEN_001',
  RATE_LIMIT_EXCEEDED:        'GEN_002',
  INTERNAL_ERROR:             'GEN_003',
  NOT_FOUND:                  'GEN_004',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
