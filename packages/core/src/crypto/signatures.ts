import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import {
  canonicalSerialize,
} from "./canonical.js";

import {
  protocolHash,
} from "./hashing.js";

/**
 * Hex signature string.
 */
export type Signature =
  `0x${string}`;

/**
 * Hex private key.
 */
export type PrivateKey =
  `0x${string}`;

/**
 * Hex public key.
 */
export type PublicKey =
  `0x${string}`;

/**
 * Convert hex string into bytes.
 */
function hexToBytes(
  value: string,
): Uint8Array {
  const normalized =
    value.startsWith("0x")
      ? value.slice(2)
      : value;

  return Uint8Array.from(
    Buffer.from(normalized, "hex"),
  );
}

/**
 * Sign arbitrary payload.
 *
 * Flow:
 *
 * payload
 * -> canonical serialization
 * -> keccak256 hash
 * -> secp256k1 sign
 */
export function signPayload(
  payload: unknown,
  privateKey: PrivateKey,
): Signature {
  const serialized =
    canonicalSerialize(payload);

  const digest =
    protocolHash(serialized);

  const signature = 
    secp256k1.sign(
        hexToBytes(digest), 
        hexToBytes(privateKey), 
    ); 
    return `0x${bytesToHex(signature)}`;
}

/**
 * Verify payload signature.
 */
export function verifyPayloadSignature(
  payload: unknown,
  signature: Signature,
  publicKey: PublicKey,
): boolean {
  try {
    const serialized =
      canonicalSerialize(payload);

    const digest =
      protocolHash(serialized);

    return secp256k1.verify(
         hexToBytes(signature),
         hexToBytes(digest),
         hexToBytes(publicKey), 
        );
  } catch {
    return false;
  }
}

/**
 * Generate public key
 * from private key.
 */
export function derivePublicKey(
  privateKey: PrivateKey,
): PublicKey {
  const publicKey =
    secp256k1.getPublicKey(
      hexToBytes(privateKey),
    );

  return `0x${bytesToHex(publicKey)}`;
}