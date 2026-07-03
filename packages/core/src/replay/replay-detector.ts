import {
  Envelope,
} from "../base/envelope.js";

import {
  ProtocolAddress,
} from "../crypto/identity.js";

import {
  createSigningDigest,
} from "../verification/signature.js";

import {
  ReplayCache,
} from "./replay-cache.js";

import {
  NonceManager,
} from "./nonce-manager.js";

/* =========================================
 * REPLAY DETECTION ERRORS
 * =======================================*/

export enum ReplayDetectionError {
  DIGEST_REPLAY =
    "DIGEST_REPLAY",

  NONCE_REPLAY =
    "NONCE_REPLAY",

  NONCE_OUT_OF_ORDER =
    "NONCE_OUT_OF_ORDER",
}

/* =========================================
 * REPLAY DETECTOR CONTEXT
 * =======================================*/

export interface ReplayDetectorContext {
  /**
   * Replay cache backend.
   */
  replayCache:
    ReplayCache;

  /**
   * Sender nonce manager.
   */
  nonceManager:
    NonceManager;

  /**
   * Deterministic execution time.
   */
  currentTime:
    number;
}

/* =========================================
 * REPLAY DETECTION RESULT
 * =======================================*/

export interface ReplayDetectionResult {
  /**
   * Replay validation result.
   */
  success: boolean;

  /**
   * Failure reason.
   */
  error?:
    ReplayDetectionError;

  /**
   * Human-readable diagnostics.
   */
  reason?: string;

  /**
   * Deterministic request digest.
   */
  digest:
    string;

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
 * -> replay cache lookup
 * -> nonce ordering validation
 * -> persist replay state
 */
export function detectReplay(
  envelope: Envelope,

  context: ReplayDetectorContext,
): ReplayDetectionResult {
  /**
   * Deterministic execution identity.
   */
  const digest =
    createSigningDigest(
      envelope,
    );

  /**
   * Sender identity.
   */
  const sender =
    envelope.header .sender as ProtocolAddress;

  /**
   * Incoming sender nonce.
   */
  const nonce =
    envelope.header.nonce;

  /**
   * STEP 1
   * Detect digest replay.
   */
  if (
    context.replayCache.has(
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

  /**
   * STEP 2
   * Validate nonce ordering.
   */
const latestNonce =
  context.nonceManager?.getNonce?.(sender) ?? 0;

if (!context.nonceManager) {
  throw new Error("ReplayDetectorContext missing nonceManager");
}

if (!context.replayCache) {
  throw new Error("ReplayDetectorContext missing replayCache");
}

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

  /**
   * STEP 3
   * Persist replay digest.
   */
  context.replayCache.set({
    digest,

    createdAt:
      context.currentTime,
  });

  /**
   * STEP 4
   * Persist latest sender nonce.
   */
  context.nonceManager.setNonce({
    sender,

    nonce,

    updatedAt:
      context.currentTime,
  });

  /**
   * Successful replay validation.
   */
  return {
    success: true,

    digest,

    nonce,
  };
}