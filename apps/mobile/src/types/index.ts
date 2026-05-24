export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'VET' | 'SHELTER_STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  isEmailVerified: boolean;
  subscription?: {
    plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    status: 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'EXPIRED';
    expiresAt?: string;
  };
}

export type PetSpecies = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'FISH' | 'REPTILE' | 'OTHER';
export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  gender: PetGender;
  dateOfBirth?: string;
  color?: string;
  weight?: number;
  microchipId?: string;
  isNeutered: boolean;
  isLost: boolean;
  photoUrl?: string;
  ownerId: string;
  nfcTag?: NfcTag;
  healthRecords?: HealthRecord[];
  lostReport?: LostPetReport;
  createdAt: string;
  updatedAt: string;
}

export interface NfcTag {
  id: string;
  uid: string;
  type: 'NTAG213' | 'NTAG215' | 'NTAG216';
  status: 'UNASSIGNED' | 'ASSIGNED' | 'LOST' | 'DEACTIVATED';
  petId?: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: 'VACCINATION' | 'CHECKUP' | 'SURGERY' | 'MEDICATION' | 'NOTE';
  title: string;
  description?: string;
  date: string;
  nextDueDate?: string;
  vetName?: string;
  attachmentUrl?: string;
}

export interface LostPetReport {
  id: string;
  petId: string;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  lastSeenAt?: string;
  lastSeenLat?: number;
  lastSeenLng?: number;
  lastSeenAddress?: string;
  description?: string;
  reward?: number;
  sightings?: Sighting[];
  createdAt: string;
}

export interface Sighting {
  id: string;
  reportId: string;
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
  reporterName?: string;
  reporterPhone?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface PublicPetProfile {
  pet: {
    id: string;
    name: string;
    species: PetSpecies;
    breed?: string;
    photoUrl?: string;
    isLost: boolean;
    color?: string;
  };
  owner: {
    name: string;
    phoneMasked: string;
    avatarUrl?: string;
  };
  emergencyContacts?: Array<{
    name: string;
    phoneMasked: string;
  }>;
  lostReport?: {
    status: string;
    lastSeenAddress?: string;
    reward?: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
