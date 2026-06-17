import { createCipheriv } from 'crypto';

const BLOCK_SIZE = 16;
const CONST_RB = 0x87;

function xorBuffers(a: Buffer, b: Buffer): Buffer {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i]! ^ b[i]!;
  return Buffer.from(out);
}

function leftShift1(input: Buffer): Buffer {
  const out = Buffer.alloc(input.length);
  let overflow = 0;
  for (let i = input.length - 1; i >= 0; i--) {
    out[i] = ((input[i]! << 1) | overflow) & 0xff;
    overflow = (input[i]! & 0x80) ? 1 : 0;
  }
  return Buffer.from(out);
}

function aes128Ecb(key: Buffer, block: Buffer): Buffer {
  const cipher = createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(block), cipher.final()]) as Buffer;
}

function generateSubkeys(key: Buffer): { k1: Buffer; k2: Buffer } {
  const L = aes128Ecb(key, Buffer.alloc(BLOCK_SIZE));
  const k1 = (L[0]! & 0x80) === 0
    ? leftShift1(L)
    : xorBuffers(leftShift1(L), Buffer.concat([Buffer.alloc(BLOCK_SIZE - 1), Buffer.from([CONST_RB])]));
  const k2 = (k1[0]! & 0x80) === 0
    ? leftShift1(k1)
    : xorBuffers(leftShift1(k1), Buffer.concat([Buffer.alloc(BLOCK_SIZE - 1), Buffer.from([CONST_RB])]));
  return { k1, k2 };
}

/**
 * AES-128-CMAC per RFC 4493.
 * Used by NTAG424 DNA for SUN message authentication.
 */
export function aesCmac(key: Buffer, message: Buffer): Buffer {
  if (key.length !== BLOCK_SIZE) throw new Error('CMAC key must be 16 bytes');
  const { k1, k2 } = generateSubkeys(key);

  const n = Math.max(1, Math.ceil(message.length / BLOCK_SIZE));
  const isComplete = message.length > 0 && message.length % BLOCK_SIZE === 0;

  let lastBlock: Buffer;
  if (isComplete) {
    lastBlock = xorBuffers(message.subarray((n - 1) * BLOCK_SIZE, n * BLOCK_SIZE), k1);
  } else {
    const remainder = message.subarray((n - 1) * BLOCK_SIZE);
    const padded = Buffer.concat([
      remainder,
      Buffer.from([0x80]),
      Buffer.alloc(BLOCK_SIZE - remainder.length - 1),
    ]);
    lastBlock = xorBuffers(padded, k2);
  }

  let x: Buffer = Buffer.alloc(BLOCK_SIZE);
  for (let i = 0; i < n - 1; i++) {
    const block = Buffer.from(message.subarray(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE));
    x = aes128Ecb(key, xorBuffers(x, block));
  }
  return aes128Ecb(key, xorBuffers(x, lastBlock));
}
