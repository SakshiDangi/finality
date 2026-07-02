/**
 * ---------------------------------------------------------------------
 * Supported Hash Algorithms
 * ---------------------------------------------------------------------
 */

export const HASH_ALGORITHMS =
  [
    "keccak256",
    "sha256",
  ] as const;

/**
 * ---------------------------------------------------------------------
 * Hex Length Constants
 * ---------------------------------------------------------------------
 */

export const ADDRESS_HEX_LENGTH =
  42;

export const PRIVATE_KEY_HEX_LENGTH =
  66;

export const SIGNATURE_HEX_LENGTH =
  132;

/**
 * ---------------------------------------------------------------------
 * Timestamp Constants
 * ---------------------------------------------------------------------
 */

export const DEFAULT_TIMESTAMP_TOLERANCE_MS =
  5 * 60 * 1000;