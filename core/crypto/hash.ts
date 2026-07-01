import {
  keccak256,
  sha256,
  hexlify,
} from "ethers";

import {
  serializeToBytes,
  serializeCanonical,
} from "./serialization";

import type {
  HashAlgorithm,
} from "./types";

import {
  HashingError,
} from "./errors";

/**
 * ---------------------------------------------------------------------
 * Hex Hash Validation
 * ---------------------------------------------------------------------
 */

export function isValidHash(
  hash: string
): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(
    hash
  );
}

/**
 * ---------------------------------------------------------------------
 * Keccak256 Hash
 * ---------------------------------------------------------------------
 *
 * Ethereum-compatible hashing.
 */

export function hashKeccak256(
  value: unknown
): string {
  try {
    const bytes =
      serializeToBytes(value);

    return keccak256(bytes);
  } catch (error) {
    throw new HashingError(
      `Keccak256 hashing failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * SHA256 Hash
 * ---------------------------------------------------------------------
 *
 * Useful for:
 * - interoperability
 * - non-EVM integrations
 * - synchronization proofs
 */

export function hashSha256(
  value: unknown
): string {
  try {
    const bytes =
      serializeToBytes(value);

    return sha256(bytes);
  } catch (error) {
    throw new HashingError(
      `SHA256 hashing failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Generic Hash Function
 * ---------------------------------------------------------------------
 */

export function hash(
  value: unknown,
  algorithm: HashAlgorithm =
    "keccak256"
): string {
  switch (algorithm) {
    case "keccak256":
      return hashKeccak256(
        value
      );

    case "sha256":
      return hashSha256(value);

    default:
      throw new HashingError(
        `Unsupported hash algorithm: ${algorithm}`
      );
  }
}

/**
 * ---------------------------------------------------------------------
 * Hash Bytes Directly
 * ---------------------------------------------------------------------
 *
 * Useful for:
 * - transport packets
 * - binary payloads
 * - synchronization proofs
 */

export function hashBytesKeccak256(
  bytes: Uint8Array
): string {
  try {
    return keccak256(bytes);
  } catch (error) {
    throw new HashingError(
      `Byte hashing failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Canonical Hash Fingerprint
 * ---------------------------------------------------------------------
 *
 * Returns:
 * canonical serialized payload + hash.
 *
 * Useful for:
 * - audits
 * - debugging
 * - replay inspection
 */

export function createHashFingerprint(
  value: unknown,
  algorithm: HashAlgorithm =
    "keccak256"
) {
  const canonical =
    serializeCanonical(value);

  const digest = hash(
    value,
    algorithm
  );

  return {
    algorithm,
    canonical,
    digest,
  };
}

/**
 * ---------------------------------------------------------------------
 * Deterministic Request ID
 * ---------------------------------------------------------------------
 *
 * Used for:
 * - request identity
 * - settlement tracking
 * - replay protection
 */

export function createRequestId(
  request: unknown
): string {
  return hashKeccak256(
    request
  );
}

/**
 * ---------------------------------------------------------------------
 * Deterministic Attestation ID
 * ---------------------------------------------------------------------
 */

export function createAttestationId(
  attestation: unknown
): string {
  return hashKeccak256(
    attestation
  );
}

/**
 * ---------------------------------------------------------------------
 * Deterministic Packet ID
 * ---------------------------------------------------------------------
 */

export function createPacketId(
  packet: unknown
): string {
  return hashKeccak256(packet);
}

/**
 * ---------------------------------------------------------------------
 * Compare Hashes Safely
 * ---------------------------------------------------------------------
 */

export function hashesEqual(
  a: string,
  b: string
): boolean {
  return (
    a.toLowerCase() ===
    b.toLowerCase()
  );
}

/**
 * ---------------------------------------------------------------------
 * Hex Hash To Bytes
 * ---------------------------------------------------------------------
 */

export function hashToBytes(
  hash: string
): Uint8Array {
  if (!isValidHash(hash)) {
    throw new HashingError(
      "Invalid hash format"
    );
  }

  return Uint8Array.from(
    Buffer.from(
      hash.slice(2),
      "hex"
    )
  );
}

/**
 * ---------------------------------------------------------------------
 * Bytes To Hex Hash
 * ---------------------------------------------------------------------
 */

export function bytesToHash(
  bytes: Uint8Array
): string {
  return hexlify(bytes);
}