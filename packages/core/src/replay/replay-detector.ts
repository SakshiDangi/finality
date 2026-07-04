import type {
  Envelope,
} from "../base/envelope.js";

import type {
ProtocolAddress,
HashDigest,
} from "../base/primitives.js";


import {
  createSigningDigest,
} from "../verification/signature.js";

import type {
  ReplayStore,
} from "../storage/replay-store.js";

/* =========================================
 * REPLAY DETECTION ERRORS
 * =======================================*/

/**
 * Canonical replay protection failures.
 *
 * Used for:
 *
 * - validator synchronization
 * - settlement protection
 * - replay prevention
 * - distributed diagnostics
 */
export enum ReplayDetectionError {
  /**
   * Request digest already executed.
   */
  DIGEST_REPLAY =
    "DIGEST_REPLAY",

  /**
   * Exact nonce replay detected.
   */
  NONCE_REPLAY =
    "NONCE_REPLAY",

  /**
   * Sender nonce older than latest accepted nonce.
   */
  NONCE_OUT_OF_ORDER =
    "NONCE_OUT_OF_ORDER",
}

/* =========================================
 * REPLAY DETECTOR CONTEXT
 * =======================================*/

/**
 * Replay runtime dependencies.
 */
export interface ReplayDetectorContext {
  /**
   * Canonical replay persistence layer.
   */
  store:
    ReplayStore;

  /**
   * Deterministic runtime time.
   */
  currentTime:
    number;
}

/* =========================================
 * REPLAY DETECTION RESULT
 * =======================================*/

/**
 * Deterministic replay validation result.
 */
export interface ReplayDetectionResult {
  /**
   * Replay validation success state.
   */
  success:
    boolean;

  /**
   * Canonical replay failure.
   */
  error?:
    ReplayDetectionError;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;

  /**
   * Deterministic request digest.
   */
  digest:
    HashDigest;

  /**
   * Sender nonce.
   */
  nonce:
    number;
}

/* =========================================
 * REPLAY DETECTOR
 * =======================================*/

/**
 * Detects duplicate protocol execution.
 *
 * Flow:
 *
 * digest
 * -> replay lookup
 * -> nonce ordering validation
 * -> persist replay state
 */
export function detectReplay(
  envelope:
    Envelope,

  context:
    ReplayDetectorContext,
): ReplayDetectionResult {
  /**
   * Deterministic execution identity.
   */
  const digest =
    createSigningDigest(
      envelope,
    );

  /**
   * Canonical sender identity.
   */
  const sender =
    envelope.header.sender;

  /**
   * Incoming sender nonce.
   */
  const nonce =
    envelope.header.nonce;

  /* =====================================
   * STEP 1
   * DETECT DIGEST REPLAY
   * ===================================*/

  if (
    context.store.hasReplay(
      digest,
    )
  ) {
    return {
      success: false,

      error:
        ReplayDetectionError.DIGEST_REPLAY,

      reason:
        "Envelope digest already executed",

      digest,

      nonce,
    };
  }

  /* =====================================
   * STEP 2
   * VALIDATE NONCE ORDERING
   * ===================================*/

  const latestNonce =
    context.store.getNonce(
      sender,
    )?.nonce ?? 0;

  /**
   * Exact nonce replay.
   */
  if (
    nonce ===
    latestNonce
  ) {
    return {
      success: false,

      error:
        ReplayDetectionError.NONCE_REPLAY,

      reason:
        "Sender nonce already used",

      digest,

      nonce,
    };
  }

  /**
   * Stale nonce ordering.
   */
  if (
    nonce <
    latestNonce
  ) {
    return {
      success: false,

      error:
        ReplayDetectionError.NONCE_OUT_OF_ORDER,

      reason:
        "Sender nonce older than latest accepted nonce",

      digest,

      nonce,
    };
  }

  /* =====================================
   * STEP 3
   * PERSIST REPLAY RECORD
   * ===================================*/

  context.store.setReplay({
    digest,

    sender,

    nonce,

    createdAt:
      context.currentTime,
  });

  /* =====================================
   * STEP 4
   * PERSIST NONCE STATE
   * ===================================*/

  context.store.setNonce({
    sender,

    nonce,

    updatedAt:
      context.currentTime,
  });

  /* =====================================
   * SUCCESS
   * ===================================*/

  return {
    success: true,

    digest,

    nonce,
  };
}