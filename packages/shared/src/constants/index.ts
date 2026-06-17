export const PETID_SCAN_BASE_URL = 'https://petid.app/scan';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_PET_PHOTO_SIZE_MB = 10;
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export const NFC_TAG_URL_PREFIX = `${PETID_SCAN_BASE_URL}/`;

export const PLAN_LIMITS = {
  FREE: { maxPets: 1, maxTags: 1 },
  BASIC: { maxPets: 3, maxTags: 3 },
  PREMIUM: { maxPets: -1, maxTags: -1 },
  ENTERPRISE: { maxPets: -1, maxTags: -1 },
} as const;

export const PET_SPECIES_LABELS: Record<string, string> = {
  DOG: 'Dog',
  CAT: 'Cat',
  BIRD: 'Bird',
  RABBIT: 'Rabbit',
  HAMSTER: 'Hamster',
  FISH: 'Fish',
  REPTILE: 'Reptile',
  OTHER: 'Other',
};
