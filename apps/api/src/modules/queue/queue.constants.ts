export const QUEUES = {
  NOTIFICATIONS: 'notifications',
  GEO: 'geo',
} as const;

export const NOTIFICATION_JOBS = {
  PUSH: 'push',
  EMAIL_VERIFICATION: 'email:verification',
  EMAIL_PASSWORD_RESET: 'email:password-reset',
  EMAIL_SUBSCRIPTION_EXPIRING: 'email:subscription-expiring',
  PET_SCANNED: 'pet-scanned',
  PET_FOUND: 'pet-found',
  SIGHTING_REPORTED: 'sighting-reported',
} as const;

export const GEO_JOBS = {
  REVERSE_GEOCODE: 'reverse-geocode',
} as const;
