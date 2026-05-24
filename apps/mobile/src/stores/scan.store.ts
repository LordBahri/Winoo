import { create } from 'zustand';
import * as Location from 'expo-location';
import { nfcService } from '../services/nfc.service';
import { api } from '../services/api.service';
import type { PublicPetProfile } from '../types';

interface ScanState {
  isScanning: boolean;
  isNfcSupported: boolean;
  lastScannedUid: string | null;
  scannedPet: PublicPetProfile | null;
  error: string | null;
  initNfc: () => Promise<void>;
  startScan: () => Promise<void>;
  cancelScan: () => void;
  clearScan: () => void;
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

      const pet = await api.get<PublicPetProfile>(`/nfc-tags/${uid}/resolve`);
      set({ scannedPet: pet, isScanning: false });

      // Log scan event with location (best-effort, non-blocking)
      Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
        let coords: { latitude: number; longitude: number } | undefined;
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
        api.post('/nfc-tags/scan-event', {
          tagUid: uid,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        }).catch(() => null);
      }).catch(() => null);

    } catch (err: any) {
      const cancelled = err?.message?.toLowerCase().includes('cancel') ||
                        err?.message?.toLowerCase().includes('usercancel');
      set({ error: cancelled ? null : (err.message ?? 'Scan failed'), isScanning: false });
    }
  },

  cancelScan: () => {
    nfcService.cancel();
    set({ isScanning: false });
  },

  clearScan: () => set({ scannedPet: null, lastScannedUid: null, error: null }),
}));
