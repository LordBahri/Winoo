import NfcManager, { NfcTech, Ndef, NfcError } from 'react-native-nfc-manager';

class NfcService {
  private initialized = false;

  async init(): Promise<boolean> {
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
    return NfcManager.isEnabled();
  }

  /**
   * Read a tag's UID. Used for registering a new tag to a pet.
   * Returns the UID as a colon-separated hex string.
   */
  async readTagUid(): Promise<string> {
    try {
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const tag = await NfcManager.getTag();

      if (!tag?.id) throw new Error('Could not read tag UID');

      const uid = Array.from(tag.id as number[])
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(':')
        .toUpperCase();

      return uid;
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => null);
    }
  }

  /**
   * Read an NDEF URL record from a tag.
   * Used to resolve a tag's pet when deep link isn't available.
   */
  async readNdefUrl(): Promise<string | null> {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      const ndefMessage = tag?.ndefMessage?.[0];
      if (!ndefMessage) return null;

      const decoded = Ndef.decodeMessage([ndefMessage]);
      const urlRecord = decoded.find((r) => r.type === 'U');
      return urlRecord?.payload ?? null;
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => null);
    }
  }

  /**
   * Write a PetID URL to an NFC tag (used during tag provisioning).
   */
  async writeTagUrl(tagUid: string): Promise<void> {
    const url = `https://petid.app/scan/${tagUid}`;
    const message = [Ndef.uriRecord(url)];
    const bytes = Ndef.encodeMessage(message);

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => null);
    }
  }

  cancel() {
    return NfcManager.cancelTechnologyRequest().catch(() => null);
  }
}

export const nfcService = new NfcService();
