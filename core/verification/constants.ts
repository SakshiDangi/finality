/**
 * ---------------------------------------------------------------------
 * Timestamp Validation
 * ---------------------------------------------------------------------
 *
 * Defines:
 * maximum allowed clock skew.
 *
 * Purpose:
 * replay + stale packet protection.
 */

/**
 * 60 seconds.
 */

export const MAX_CLOCK_SKEW_MS =
  60_000;

/**
 * ---------------------------------------------------------------------
 * Future Timestamp Tolerance
 * ---------------------------------------------------------------------
 *
 * Protects against:
 * invalid future-dated packets.
 */

/**
 * 15 seconds.
 */

export const MAX_FUTURE_DRIFT_MS =
  15_000;

/**
 * ---------------------------------------------------------------------
 * Replay Protection
 * ---------------------------------------------------------------------
 */

/**
 * Maximum allowed nonce value.
 *
 * Prevents:
 * overflow abuse.
 */

export const MAX_NONCE =
  Number.MAX_SAFE_INTEGER;

/**
 * Minimum allowed nonce value.
 */

export const MIN_NONCE =
  0;

/**
 * ---------------------------------------------------------------------
 * Transport Validation
 * ---------------------------------------------------------------------
 */

/**
 * Maximum allowed transport packet size.
 *
 * Purpose:
 * DoS prevention.
 */

/**
 * 1 MB.
 */

export const MAX_PACKET_SIZE_BYTES =
  1024 * 1024;

/**
 * ---------------------------------------------------------------------
 * Request Validation
 * ---------------------------------------------------------------------
 */

/**
 * Maximum serialized request size.
 *
 * Prevents:
 * oversized payload attacks.
 */

/**
 * 256 KB.
 */

export const MAX_REQUEST_SIZE_BYTES =
  256 * 1024;

/**
 * ---------------------------------------------------------------------
 * Attestation Validation
 * ---------------------------------------------------------------------
 */

/**
 * Maximum allowed attestation age.
 *
 * Prevents:
 * stale validator confirmations.
 */

/**
 * 5 minutes.
 */

export const MAX_ATTESTATION_AGE_MS =
  5 * 60 * 1000;

/**
 * ---------------------------------------------------------------------
 * Settlement Validation
 * ---------------------------------------------------------------------
 */

/**
 * Maximum settlement transition depth.
 *
 * Prevents:
 * recursive transition abuse.
 */

export const MAX_SETTLEMENT_TRANSITIONS =
  100;

/**
 * ---------------------------------------------------------------------
 * Synchronization Validation
 * ---------------------------------------------------------------------
 */

/**
 * Maximum synchronization request count.
 *
 * Prevents:
 * reconciliation flooding.
 */

export const MAX_SYNC_REQUESTS =
  10_000;

/**
 * ---------------------------------------------------------------------
 * Verification Monitoring
 * ---------------------------------------------------------------------
 */

/**
 * Maximum validation retries.
 */

export const MAX_VALIDATION_RETRIES =
  3;

/**
 * ---------------------------------------------------------------------
 * Supported Settlement States
 * ---------------------------------------------------------------------
 */

export const SETTLEMENT_STATES =
  [
    "CREATED",
    "VERIFIED",
    "FINALIZED",
    "REJECTED",
  ] as const;

/**
 * ---------------------------------------------------------------------
 * Allowed Settlement Transitions
 * ---------------------------------------------------------------------
 */

export const ALLOWED_SETTLEMENT_TRANSITIONS =
  {
    CREATED: [
      "VERIFIED",
      "REJECTED",
    ],

    VERIFIED: [
      "FINALIZED",
      "REJECTED",
    ],

    FINALIZED: [],

    REJECTED: [],
  } as const;

/**
 * ---------------------------------------------------------------------
 * Supported Packet Types
 * ---------------------------------------------------------------------
 */

export const PACKET_TYPES =
  [
    "REQUEST",
    "ATTESTATION",
    "SYNC",
    "SETTLEMENT",
    "REPLAY",
  ] as const;