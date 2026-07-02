import {
  MAX_NONCE,
  MIN_NONCE,
} from "./constants";

import type {
  ValidationResult,
  ReplayValidationState,
} from "./types";

import {
  ReplayValidationError,
} from "./errors";

/**
 * ---------------------------------------------------------------------
 * Nonce Validation Input
 * ---------------------------------------------------------------------
 */

export interface NonceValidationInput {
  /**
   * -------------------------------------------------------------
   * Incoming Nonce
   * -------------------------------------------------------------
   */

  nonce: unknown;

  /**
   * -------------------------------------------------------------
   * Existing Replay State
   * -------------------------------------------------------------
   */

  replayState?:
    ReplayValidationState;

  /**
   * -------------------------------------------------------------
   * Require Monotonic Ordering
   * -------------------------------------------------------------
   */

  requireMonotonic?:
    boolean;
}

/**
 * ---------------------------------------------------------------------
 * Validate Nonce
 * ---------------------------------------------------------------------
 *
 * Protects against:
 * - replay attacks
 * - duplicate execution
 * - nonce overflow
 * - ordering inconsistencies
 */

export function validateNonce(
  input:
    NonceValidationInput
): ValidationResult {
  const {
    nonce,
    replayState,
    requireMonotonic =
      true,
  } = input;

  /**
   * -------------------------------------------------------------
   * Missing Nonce
   * -------------------------------------------------------------
   */

  if (
    nonce === undefined ||
    nonce === null
  ) {
    throw new ReplayValidationError(
      "MISSING_NONCE",
      "Nonce is required"
    );
  }

  /**
   * -------------------------------------------------------------
   * Numeric Validation
   * -------------------------------------------------------------
   */

  if (
    typeof nonce !==
      "number" ||
    !Number.isInteger(
      nonce
    )
  ) {
    throw new ReplayValidationError(
      "INVALID_NONCE",
      "Nonce must be an integer"
    );
  }

  /**
   * -------------------------------------------------------------
   * Bounds Validation
   * -------------------------------------------------------------
   */

  if (
    nonce < MIN_NONCE
  ) {
    throw new ReplayValidationError(
      "INVALID_NONCE",
      `Nonce must be >= ${MIN_NONCE}`
    );
  }

  if (
    nonce > MAX_NONCE
  ) {
    throw new ReplayValidationError(
      "INVALID_NONCE",
      `Nonce exceeds maximum allowed value ${MAX_NONCE}`
    );
  }

  /**
   * -------------------------------------------------------------
   * Replay State Validation
   * -------------------------------------------------------------
   */

  if (replayState) {
    /**
     * -----------------------------------------------------------
     * Replay Detection
     * -----------------------------------------------------------
     */

    if (
      replayState.processed &&
      replayState.nonce ===
        nonce
    ) {
      throw new ReplayValidationError(
        "REPLAY_DETECTED",
        `Nonce ${nonce} has already been processed`
      );
    }

    /**
     * -----------------------------------------------------------
     * Monotonic Ordering Validation
     * -----------------------------------------------------------
     */

    if (
      requireMonotonic &&
      nonce <=
        replayState.nonce
    ) {
      throw new ReplayValidationError(
        "INVALID_NONCE",
        `Nonce ${nonce} must be greater than previous nonce ${replayState.nonce}`
      );
    }
  }

  /**
   * -------------------------------------------------------------
   * Validation Success
   * -------------------------------------------------------------
   */

  return {
    valid: true,

    reason: "VALID",

    stage: "NONCE",

    severity: "INFO",

    validatedAt:
      Date.now(),

    message:
      "Nonce validation succeeded",
  };
}

/**
 * ---------------------------------------------------------------------
 * Lightweight Replay Check
 * ---------------------------------------------------------------------
 */

export function isReplayDetected(
  nonce: number,
  replayState?:
    ReplayValidationState
): boolean {
  if (!replayState) {
    return false;
  }

  return (
    replayState.processed &&
    replayState.nonce ===
      nonce
  );
}

/**
 * ---------------------------------------------------------------------
 * Monotonic Nonce Check
 * ---------------------------------------------------------------------
 */

export function isMonotonicNonce(
  nonce: number,
  previousNonce:
    number
): boolean {
  return (
    nonce >
    previousNonce
  );
}