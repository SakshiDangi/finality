import {
  randomBytes,
} from "node:crypto";

import {
  secp256k1,
} from "@noble/curves/secp256k1.js";

import {
  bytesToHex,
} from "@noble/hashes/utils.js";

import {
  HashDigest,
  hashString,
} from "./hashing.js";

/**
 * Protocol private key.
 */
export type PrivateKey =
  `0x${string}`;

/**
 * Protocol public key.
 */
export type PublicKey =
  `0x${string}`;

/**
 * Protocol address.
 */
export type ProtocolAddress =
  `0x${string}`;

/**
 * Runtime cryptographic keypair.
 *
 * Used by:
 * - validators
 * - relayers
 * - wrapper applications
 * - settlement engines
 * - synchronization nodes
 */
export interface KeyPair {
  privateKey:
    PrivateKey;

  publicKey:
    PublicKey;
}

/**
 * runtime protocol identity.
 *
 * Represents a cryptographic actor
 * inside the protocol network.
 *
 * Used by:
 * - validators
 * - relayers
 * - settlement engines
 * - wrappers
 * - synchronization nodes
 */
export interface ProtocolIdentity {
  /**
   * Human-readable node id.
   */
  id: string;

  /**
   * Private signing key.
   */
  privateKey:
    PrivateKey;

  /**
   * Public verification key.
   */
  publicKey:
    PublicKey;

  /**
   * Deterministic protocol address.
   */
  address:
    ProtocolAddress;
}

/**
 * Converts hex string
 * into byte array.
 */
function hexToBytes(
  value: string,
): Uint8Array {
  const normalized =
    value.startsWith("0x")
      ? value.slice(2)
      : value;

  return Uint8Array.from(
    Buffer.from(
      normalized,
      "hex",
    ),
  );
}

/**
 * Generates cryptographically
 * secure private key.
 */
export function generatePrivateKey():
  PrivateKey {
  const privateKey =
    secp256k1.utils.randomSecretKey();

  return `0x${bytesToHex(
    privateKey,
  )}`;
}

/**
 * Derives public key
 * from private key.
 */
export function derivePublicKey(
  privateKey: PrivateKey,
): PublicKey {
  const publicKey =
    secp256k1.getPublicKey(
      hexToBytes(
        privateKey,
      ),
    );

  return `0x${bytesToHex(
    publicKey,
  )}`;
}

/**
 * Generates complete
 * cryptographic keypair.
 */
export function generateKeyPair():
  KeyPair {
  const privateKey =
    generatePrivateKey();

  const publicKey =
    derivePublicKey(
      privateKey,
    );

  return {
    privateKey,
    publicKey,
  };
}

/**
 * Produces deterministic
 * protocol address.
 *
 * This creates stable
 * protocol-native identities.
 *
 * Flow:
 *
 * public key
 * -> sha256
 * -> last 20 bytes
 */
export function deriveAddress(
  publicKey: PublicKey,
): ProtocolAddress {
  const digest =
    hashString(publicKey);

  /**
   * 20-byte protocol address.
   */
  return `0x${digest.slice(
    -40,
  )}`;
}

/**
 * Creates runtime identity.
 */
export function createIdentity(
  id?: string,
): ProtocolIdentity {
  const keyPair =
    generateKeyPair();

  return {
    id:
      id ??
      `node-${randomBytes(6).toString(
        "hex",
      )}`,
  
    privateKey:
      keyPair.privateKey,
  
    publicKey:
      keyPair.publicKey,
  
    address:
      deriveAddress(
        keyPair.publicKey,
      ),
  };
}

/**
 * Validates public key.
 */
export function isValidPublicKey(
  value: string,
): boolean {
  try {
    const normalized =
      value.startsWith("0x")
        ? value.slice(2)
        : value;

    secp256k1.Point.fromHex(
      normalized,
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates private key.
 */
export function isValidPrivateKey(
  value: string,
): boolean {
  try {
    const normalized =
      value.startsWith("0x")
        ? value.slice(2)
        : value;
    const bytes = 
      hexToBytes(
        normalized, 
      );
    return secp256k1.utils.isValidSecretKey(
      bytes,
      );
  } catch {
    return false;
  }
}

/**
 * Validates protocol address.
 */
export function isValidAddress(
  value: string,
): boolean {
  return /^0x[a-f0-9]{40}$/i.test(
    value,
  );
}