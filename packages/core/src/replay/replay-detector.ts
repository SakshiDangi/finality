import type {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import {
  ProtocolState,
} from "../state/transitions.js";

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
   * Request digest already exists.
   */
  DIGEST_REPLAY =
    "DIGEST_REPLAY",

  /**
   * Exact sender nonce reuse.
   */
  NONCE_REPLAY =
    "NONCE_REPLAY",

  /**
   * Sender nonce is stale.
   */
  NONCE_OUT_OF_ORDER =
    "NONCE_OUT_OF_ORDER",
}

/* =========================================
 * REPLAY DETECTOR CONTEXT
 * =======================================*/

/**
 * Replay detector runtime dependencies.
 *
 * Provides deterministic protocol
 * replay validation context.
 */
export interface ReplayDetectorContext {
  /**
   * Canonical replay persistence layer.
   */
  store:
    ReplayStore;

  /**
   * Deterministic runtime timestamp.
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
   * Canonical sender nonce.
   */
  nonce:
    number;

  /**
   * Current lifecycle state.
   */
  state?:
    ProtocolState;
}

/* =========================================
 * REPLAY DETECTOR
 * =======================================*/

/**
 * Detects duplicate protocol execution.
 *
 * Flow:
 *
 * envelope
 * -> signing digest
 * -> replay lookup
 * -> nonce validation
 * -> persist replay state
 * -> persist nonce state
 */
export function detectReplay(
  envelope:
    Envelope,

  context:
    ReplayDetectorContext,
): ReplayDetectionResult {

  /* =====================================
   * STEP 1
   * CREATE DIGEST
   * ===================================*/

  /**
   * Deterministic execution identity.
   */
  const digest =
    createSigningDigest(
      envelope,
    );

  /* =====================================
   * STEP 2
   * EXTRACT HEADER DATA
   * ===================================*/

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
   * STEP 3
   * DETECT DIGEST REPLAY
   * ===================================*/

  /**
   * Existing replay record.
   */
  const existingReplay =
    context.store.getReplay(
      digest,
    );

  if (
    existingReplay
  ) {
    return {
      success: false,

      error:
        ReplayDetectionError.DIGEST_REPLAY,

      reason:
        "Envelope digest already exists",

      digest,

      nonce,

      state:
        existingReplay.state,
    };
  }

  /* =====================================
   * STEP 4
   * VALIDATE NONCE ORDERING
   * ===================================*/

  /**
   * Latest accepted sender nonce.
   */
  const latestNonce =
    context.store.getLatestNonce(
      sender,
    ) ?? 0;

  /* =====================================
   * EXACT NONCE REPLAY
   * ===================================*/

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

  /* =====================================
   * STALE NONCE
   * ===================================*/

  if (
    nonce <
    latestNonce
  ) {
    return {
      success: false,

      error:
        ReplayDetectionError.NONCE_OUT_OF_ORDER,

      reason:
        "Sender nonce is stale",

      digest,

      nonce,
    };
  }

  /* =====================================
   * STEP 5
   * PERSIST REPLAY RECORD
   * ===================================*/

  context.store.setReplay({
    digest,

    sender,

    nonce,

    state:
      ProtocolState.RECEIVED,

    createdAt:
      context.currentTime,

    updatedAt:
      context.currentTime,
  });

  /* =====================================
   * STEP 6
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

    state:
      ProtocolState.RECEIVED,
  };
}