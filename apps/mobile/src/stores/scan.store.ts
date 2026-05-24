import { create } from 'zustand';
import * as Location from 'expo-location';
import { nfcService } from '../services/nfc.service';
import { api } from '../services/api.service';

interface PublicPetProfile {
  tagUid: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    color: string | null;
    profileImageUrl: string | null;
    isLost: boolean;
    lostAt: string | null;
    ownerFirstName: string;
    ownerMaskedPhone: string | null;
  };
}

interface ScanState {
  isScanning: boolean;
  isNfcSupported: boolean;
  lastScannedUid: string | null;
  scannedPet: PublicPetProfile | null;
  error: string | null;
  initNfc: () => Promise<void>;
  startScan: () => Promise<void>;
  stopScan: () => void;
  clearResult: () => void;
  resolveTag: (uid: string) => Promise<void>;
}

export const useScanStore = create<ScanState>((set, get) => ({
  isScanning: false,
  isNfcSupported: false,
  lastScannedUid: null,
  scannedPet: null,
  error: null,

  initNfc: async () => {
    const supported = await nfcService.init();
    set({ isNfcSupported: supported });
  },

  startScan: async () => {
    if (get().isScanning) return;
    set({ isScanning: true, error: null, scannedPet: null });

    try {
      const uid = await nfcService.readTagUid();
      set({ lastScannedUid: uid });
      await get().resolveTag(uid);

      // Log scan event with location (best-effort)
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coords: { latitude: number; longitude: number } | null = null;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }

      api.post('/tags/scan-event', {
        tagUid: uid,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }).catch(() => null);
    } catch (err: any) {
      set({ error: err.message ?? 'Scan failed' });
    } finally {
      set({ isScanning: false });
    }
  },

  stopScan: () => {
    nfcService.cancel();
    set({ isScanning: false });
  },

  clearResult: () => set({ scannedPet: null, lastScannedUid: null, error: null }),

  resolveTag: async (uid: string) => {
    const pet = await api.get<PublicPetProfile>(`/tags/${uid}`);
    set({ scannedPet: pet });
  },
}));
