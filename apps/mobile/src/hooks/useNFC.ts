import { useState, useCallback } from 'react';
import { nfcService } from '@services/nfc.service';
import { apiClient } from '@services/api.service';
import type { PublicPetProfile } from '@/types';

interface NFCState {
  isScanning: boolean;
  error: string | null;
  scannedUid: string | null;
  petProfile: PublicPetProfile | null;
}

export function useNFC() {
  const [state, setState] = useState<NFCState>({
    isScanning: false,
    error: null,
    scannedUid: null,
    petProfile: null,
  });

  const scan = useCallback(async () => {
    setState(s => ({ ...s, isScanning: true, error: null }));
    try {
      const result = await nfcService.scanTag();
      const uid = result.uid;
      if (!uid) {
        setState(s => ({ ...s, isScanning: false, error: 'Could not read tag' }));
        return null;
      }
      setState(s => ({ ...s, scannedUid: uid }));

      // Resolve to pet profile
      try {
        const profile = await apiClient.get<PublicPetProfile>(`/tags/${uid}`);
        setState(s => ({ ...s, isScanning: false, petProfile: profile }));
        return profile;
      } catch {
        setState(s => ({ ...s, isScanning: false, error: 'Tag not registered' }));
        return null;
      }
    } catch (err: any) {
      const cancelled = err?.message?.includes('cancelled') || err?.message?.includes('UserCancel');
      setState(s => ({
        ...s,
        isScanning: false,
        error: cancelled ? null : (err?.message ?? 'Scan failed'),
      }));
      return null;
    }
  }, []);

  const cancel = useCallback(async () => {
    await nfcService.cancel();
    setState(s => ({ ...s, isScanning: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ isScanning: false, error: null, scannedUid: null, petProfile: null });
  }, []);

  return { ...state, scan, cancel, reset };
}
