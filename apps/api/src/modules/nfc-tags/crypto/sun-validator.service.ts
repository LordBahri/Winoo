import { Injectable, Logger } from '@nestjs/common';
import { createDecipheriv } from 'crypto';
import { aesCmac } from './cmac.util';

export interface SunValidationResult {
  valid: boolean;
  reason?: 'invalid_picc' | 'invalid_cmac' | 'counter_replay' | 'missing_key' | 'malformed';
  uid?: string;
  counter?: number;
}

/**
 * NTAG424 DNA Secure Unique NFC (SUN) message validator.
 *
 * Spec: NXP AN12196 — NTAG 424 DNA features and hints.
 * The tag generates a URL on each tap with `picc_data` (16-byte AES-ECB-encrypted UID+counter)
 * and `cmac` (8-byte AES-CMAC over the URL — RFC 4493).
 *
 * Server flow:
 *   1. Decrypt picc_data with the tag's master key → recover UID and tap counter
 *   2. Derive a session MAC key from master key + counter (NXP SV2 KDF)
 *   3. Recompute CMAC over the URL components; compare to received CMAC
 *   4. Verify counter > last_stored_counter (replay protection)
 */
@Injectable()
export class SunValidatorService {
  private readonly logger = new Logger(SunValidatorService.name);

  /**
   * Validate a SUN URL's picc_data and cmac parameters against the tag's master key.
   *
   * @param masterKey - 16-byte AES-128 key bound to the tag at provisioning
   * @param piccDataHex - hex string from URL's `picc_data` query parameter
   * @param cmacHex - hex string from URL's `cmac` query parameter
   * @param lastSeenCounter - the last counter value the server recorded for this tag
   */
  validate(
    masterKey: Buffer,
    piccDataHex: string,
    cmacHex: string,
    lastSeenCounter: number,
  ): SunValidationResult {
    if (masterKey.length !== 16) {
      return { valid: false, reason: 'missing_key' };
    }
    if (!/^[0-9a-fA-F]{32}$/.test(piccDataHex) || !/^[0-9a-fA-F]{16}$/.test(cmacHex)) {
      return { valid: false, reason: 'malformed' };
    }

    const piccCipher = Buffer.from(piccDataHex, 'hex');
    const receivedCmac = Buffer.from(cmacHex, 'hex');

    // Step 1: AES-128-ECB decrypt picc_data → 16 bytes plaintext
    //         layout: 0xC7 | UID(7) | counter(3, LE) | RFU(5)
    let plain: Buffer;
    try {
      const decipher = createDecipheriv('aes-128-ecb', masterKey, null);
      decipher.setAutoPadding(false);
      plain = Buffer.concat([decipher.update(piccCipher), decipher.final()]);
    } catch (err) {
      this.logger.warn(`PICC decrypt failed: ${(err as Error).message}`);
      return { valid: false, reason: 'invalid_picc' };
    }

    // NTAG424 DNA picc tag byte is 0xC7 when UID-mirroring is enabled
    if (plain[0] !== 0xc7) {
      return { valid: false, reason: 'invalid_picc' };
    }

    const uid = plain.subarray(1, 8).toString('hex').toUpperCase();
    const counter = plain[8]! | (plain[9]! << 8) | (plain[10]! << 16); // LE 24-bit

    // Step 2: Derive session MAC key per NXP SV2 KDF
    //         SV2 = 0x3C C3 00 01 00 80 | UID(7) | counter(3, LE)
    const sv2 = Buffer.concat([
      Buffer.from([0x3c, 0xc3, 0x00, 0x01, 0x00, 0x80]),
      plain.subarray(1, 8),
      plain.subarray(8, 11),
    ]);
    const sessionMacKey = aesCmac(masterKey, sv2);

    // Step 3: CMAC over empty message under session key, then fold to 8 bytes
    //         (NXP truncation: bytes 1,3,5,7,9,11,13,15)
    const fullMac = aesCmac(sessionMacKey, Buffer.alloc(0));
    const expectedCmac = Buffer.from([
      fullMac[1]!, fullMac[3]!, fullMac[5]!, fullMac[7]!,
      fullMac[9]!, fullMac[11]!, fullMac[13]!, fullMac[15]!,
    ]);

    if (!timingSafeEqual(expectedCmac, receivedCmac)) {
      return { valid: false, reason: 'invalid_cmac', uid, counter };
    }

    // Step 4: Replay protection
    if (counter <= lastSeenCounter) {
      return { valid: false, reason: 'counter_replay', uid, counter };
    }

    return { valid: true, uid, counter };
  }
}

/** Constant-time buffer comparison to prevent CMAC timing attacks. */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
