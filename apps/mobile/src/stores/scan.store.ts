import { create } from 'zustand';
import * as Location from 'expo-location';
import { nfcService, type TagScanResult } from '../services/nfc.service';
import { api } from '../services/api.service';
import type { PublicPetProfile } from '../types';

interface ScanState {
  isScanning: boolean;
  isNfcSupported: boolean;
  lastTag: TagScanResult | null;
  scannedPet: PublicPetProfile | null;
  cmacStatus: 'valid' | 'invalid' | 'not_required' | null;
  error: string | null;
  initNfc: () => Promise<void>;
  startScan: () => Promise<void>;
  cancelScan: () => void;
  clearScan: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  isScanning: false,
  isNfcSupported: false,
  lastTag: null,
  scannedPet: null,
  cmacStatus: null,
  error: null,

  initNfc: async () => {
    const supported = await nfcService.init();
    set({ isNfcSupported: supported });
  },

  startScan: async () => {
    if (get().isScanning) return;
    set({ isScanning: true, error: null, scannedPet: null, cmacStatus: null });

    try {
      const tag = await nfcService.scanTag({
        promptMessage: 'Hold your phone near the pet tag',
      });
      set({ lastTag: tag });

      // Best-effort location (non-blocking)
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch {
        /* location is optional */
      }

      // Prefer SUN-validated recovery endpoint when the tag exposes SUN params
      if (tag.sun) {
        const qs = new URLSearchParams({
          picc_data: tag.sun.piccData,
          cmac: tag.sun.cmac,
          ...(coords && { latitude: String(coords.latitude), longitude: String(coords.longitude) }),
        });
        const result = await api.get<{
          publicId: string;
          cmacStatus: 'valid' | 'invalid' | 'not_required';
          pet: PublicPetProfile | null;
        }>(`/tags/recover/${tag.sun.publicId}?${qs}`);

        set({
          scannedPet: result.pet,
          cmacStatus: result.cmacStatus,
          isScanning: false,
        });
        return;
      }

      // Fallback: legacy UID-based lookup
      const pet = await api.get<PublicPetProfile>(`/tags/${tag.uid}`);
      set({ scannedPet: pet, cmacStatus: 'not_required', isScanning: false });

      api.post('/tags/scan-event', {
        tagUid: tag.uid,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }).catch(() => null);
    } catch (err: any) {
      const cancelled = err?.message?.toLowerCase?.().includes('cancel') ||
                        err?.message?.toLowerCase?.().includes('usercancel');
      set({ error: cancelled ? null : (err?.message ?? 'Scan failed'), isScanning: false });
    }
  },

  cancelScan: () => {
    nfcService.cancel();
    set({ isScanning: false });
  },

  clearScan: () => set({ scannedPet: null, lastTag: null, cmacStatus: null, error: null }),
}));
