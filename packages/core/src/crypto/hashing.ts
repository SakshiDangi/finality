import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  canonicalJSONStringify,
} from "./canonical.js";

import type {
  HashDigest,
} from "../base/primitives.js";

/**
 * Supported protocol hashing algorithms.
 */
export const HASH_ALGORITHM = {
  SHA256:
    "sha256",

  SHA512:
    "sha512",
} as const;

/**
 * Supported hashing algorithm type.
 */
export type HashAlgorithm =
  typeof HASH_ALGORITHM[
    keyof typeof HASH_ALGORITHM
  ];

/**
 * Hash raw string input.
 *
 * Output:
 * - deterministic
 * - lowercase
 * - hex-prefixed
 */
export function hashString(
  value: string,
  algorithm: HashAlgorithm =
    HASH_ALGORITHM.SHA256,
): HashDigest {
  const digest =
    createHash(algorithm)
      .update(value)
      .digest("hex");

  return `0x${digest}`;
}

/**
 * Hash arbitrary protocol data.
 *
 * Data is canonicalized first
 * to guarantee deterministic
 * hashing across environments.
 */
export function hashCanonical(
  value: unknown,
  algorithm: HashAlgorithm =
    HASH_ALGORITHM.SHA256,
): HashDigest {
  const canonical =
    canonicalJSONStringify(
      value,
    );

  return hashString(
    canonical,
    algorithm,
  );
}

/**
 * Default protocol hash function.
 *
 * Used for:
 * - signatures
 * - attestations
 * - replay protection
 * - synchronization
 * - settlement verification
 */
export function protocolHash(
  value: string,
): HashDigest {
  return hashString(
    value,
    HASH_ALGORITHM.SHA256,
  );
}

/**
 * Constant-time digest comparison.
 *
 * Critical for cryptographic
 * verification paths.
 */
export function hashesEqual(
  left: HashDigest,
  right: HashDigest,
): boolean {
  const leftBuffer =
    Buffer.from(
      left.slice(2),
      "hex",
    );

  const rightBuffer =
    Buffer.from(
      right.slice(2),
      "hex",
    );

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
}