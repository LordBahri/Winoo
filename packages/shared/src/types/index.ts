// ─── Enums ─────────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VET' | 'SHELTER' | 'PET_OWNER';

export type PetSpecies = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'HAMSTER' | 'FISH' | 'REPTILE' | 'OTHER';

export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export type NfcTagStatus = 'UNLINKED' | 'ACTIVE' | 'DEACTIVATED';

export type LostPetStatus = 'ACTIVE' | 'FOUND' | 'CLOSED' | 'EXPIRED';

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

export type PlanName = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

// ─── Entities ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed?: string | null;
  color?: string | null;
  weightKg?: number | null;
  dateOfBirth?: string | null;
  gender: PetGender;
  profileImageUrl?: string | null;
  isLost: boolean;
  lostAt?: string | null;
  nfcTag?: NfcTagSummary | null;
  createdAt: string;
}

export interface NfcTagSummary {
  tagUid: string;
  status: NfcTagStatus;
  lastScannedAt?: string | null;
}

export interface PublicPetProfile {
  tagUid: string;
  pet: {
    id: string;
    name: string;
    species: PetSpecies;
    breed?: string | null;
    color?: string | null;
    profileImageUrl?: string | null;
    isLost: boolean;
    lostAt?: string | null;
    ownerFirstName: string;
    ownerMaskedPhone?: string | null;
  };
}

export interface LostPetReport {
  id: string;
  petId: string;
  lastSeenAddress?: string | null;
  lastSeenLatitude?: number | null;
  lastSeenLongitude?: number | null;
  lastSeenAt?: string | null;
  description?: string | null;
  rewardAmount?: number | null;
  rewardCurrency?: string | null;
  status: LostPetStatus;
  contactPhone?: string | null;
  contactEmail?: string | null;
  pet: Pick<Pet, 'id' | 'name' | 'species' | 'breed' | 'color' | 'profileImageUrl'>;
  createdAt: string;
}

export interface ScanEvent {
  id: string;
  tagUid: string;
  petId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  country?: string | null;
  deviceType?: string | null;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: PlanName;
  priceMonthly: number;
  priceYearly: number;
  maxPets: number;
  maxTags: number;
  features: Record<string, unknown>;
}

// ─── API Response wrappers ─────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  timestamp: string;
}
