import NfcManager, { NfcTech, Ndef, NfcEvents } from 'react-native-nfc-manager';
import { Platform, Vibration } from 'react-native';

/**
 * Production NFC service for PetID.
 *
 * iOS: uses NFCNDEFReaderSession (the system sheet) on iPhone 7+.
 * Android: uses Reader Mode to bypass Samsung Pay / Beam intent dispatch,
 *          letting our app intercept the scan even when other NFC apps are installed.
 *
 * Supports NTAG213/215/216 (Type 2) and NTAG424 DNA (Type 4) for SUN URLs.
 */

export type TagScanResult = {
  uid: string;
  url: string | null;
  /** Parsed SUN parameters from the NDEF URL — present only for NTAG424 DNA tags */
  sun: { publicId: string; piccData: string; cmac: string } | null;
  /** Approximate tag chip family inferred from techList */
  tagModel: 'NTAG21x' | 'NTAG424_DNA' | 'UNKNOWN';
};

export type ScanOptions = {
  /** Message shown in the iOS system NFC sheet. Ignored on Android. */
  promptMessage?: string;
  /** Auto-cancel after N ms even if no tag detected. */
  timeoutMs?: number;
};

class NfcService {
  private initialized = false;

  async init(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      const supported = await NfcManager.isSupported();
      if (!supported) return false;
      await NfcManager.start();
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    if (!this.initialized) return false;
    if (Platform.OS === 'ios') return true; // iOS doesn't expose an "enabled" toggle
    return NfcManager.isEnabled();
  }

  /**
   * Read a tag — returns UID, optional NDEF URL, and parsed SUN params if present.
   * Uses Reader Mode on Android (priority over system dispatch).
   * Uses NFCNDEFReaderSession on iOS (system sheet).
   */
  async scanTag(options: ScanOptions = {}): Promise<TagScanResult> {
    const { promptMessage = 'Hold your phone near the tag', timeoutMs = 30_000 } = options;
    const ok = await this.init();
    if (!ok) throw new NfcError('NFC is not available on this device');

    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      // Race: scan vs timeout
      const scanPromise = Platform.OS === 'ios'
        ? this.scanIos(promptMessage)
        : this.scanAndroid();

      const result = await Promise.race([
        scanPromise,
        new Promise<TagScanResult>((_, reject) => {
          timer = setTimeout(() => reject(new NfcError('Scan timed out')), timeoutMs);
        }),
      ]);

      // Success haptic
      Vibration.vibrate(40);
      if (Platform.OS === 'ios') {
        NfcManager.setAlertMessageIOS('✓ Tag detected');
      }

      return result;
    } finally {
      if (timer) clearTimeout(timer);
      await NfcManager.cancelTechnologyRequest().catch(() => null);
    }
  }

  private async scanIos(promptMessage: string): Promise<TagScanResult> {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: promptMessage,
      invalidateAfterFirstRead: true,
    });
    const tag = await NfcManager.getTag();
    return this.parseTag(tag);
  }

  private async scanAndroid(): Promise<TagScanResult> {
    // Reader Mode bypasses system NFC dispatch (Samsung Pay, Android Beam, etc.)
    await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA]);
    const tag = await NfcManager.getTag();
    return this.parseTag(tag);
  }

  private parseTag(tag: any): TagScanResult {
    if (!tag) throw new NfcError('No tag detected');

    const uid = this.uidToColonHex(tag.id);
    const ndefMessage = tag.ndefMessage?.[0];
    let url: string | null = null;

    if (ndefMessage) {
      try {
        const decoded = Ndef.decodeMessage([ndefMessage]);
        const urlRecord = decoded.find((r: any) => r.type === 'U');
        if (urlRecord) url = Ndef.uri.decodePayload(urlRecord.payload as any);
      } catch {
        // Malformed NDEF — fall through to UID-only result
      }
    }

    const sun = url ? this.parseSunUrl(url) : null;
    const tagModel = this.detectTagModel(tag.techTypes ?? [], !!sun);

    return { uid, url, sun, tagModel };
  }

  /**
   * Parse the SUN parameters from an NTAG424 DNA URL.
   * Expected format: https://domain/t/{publicId}?picc_data={hex32}&cmac={hex16}
   */
  private parseSunUrl(url: string): TagScanResult['sun'] {
    try {
      const u = new URL(url);
      const segments = u.pathname.split('/').filter(Boolean);
      const publicId = segments[segments.length - 1];
      const piccData = u.searchParams.get('picc_data');
      const cmac = u.searchParams.get('cmac');
      if (publicId && piccData && cmac && /^[0-9a-f]{32}$/i.test(piccData) && /^[0-9a-f]{16}$/i.test(cmac)) {
        return { publicId, piccData, cmac };
      }
    } catch {
      // Invalid URL
    }
    return null;
  }

  private detectTagModel(techList: string[], hasSun: boolean): TagScanResult['tagModel'] {
    if (hasSun || techList.includes('android.nfc.tech.IsoDep')) return 'NTAG424_DNA';
    if (techList.includes('android.nfc.tech.NfcA') || techList.includes('android.nfc.tech.Ndef')) return 'NTAG21x';
    return 'UNKNOWN';
  }

  private uidToColonHex(id: number[] | string | undefined): string {
    if (!id) throw new NfcError('Tag has no UID');
    const bytes = typeof id === 'string'
      ? id.match(/.{1,2}/g)?.map((h) => parseInt(h, 16)) ?? []
      : id;
    return bytes
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase();
  }

  /**
   * Write a PetID NDEF URL to a blank tag (used in owner-side activation).
   * Only call for NTAG21x tags — NTAG424 DNA must be programmed at fulfillment
   * time with AES keys, not at runtime from a phone.
   */
  async writeTagUrl(publicId: string, baseUrl = 'https://petid.app'): Promise<void> {
    const url = `${baseUrl}/t/${publicId}`;
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
    if (!bytes) throw new NfcError('Failed to encode NDEF message');

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold near the blank tag to activate',
      });
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      Vibration.vibrate(60);
    } finally {
      await NfcManager.cancelTechnologyRequest().catch(() => null);
    }
  }

  async cancel() {
    await NfcManager.cancelTechnologyRequest().catch(() => null);
  }
}

export class NfcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NfcError';
  }
}

export const nfcService = new NfcService();
