import {
  Envelope,
} from "../base/envelope.js";

/* =========================================
 * NONCE VERIFICATION ERRORS
 * =======================================*/

export enum NonceVerificationError {
  INVALID_NONCE =
    "INVALID_NONCE",

  NONCE_REPLAY =
    "NONCE_REPLAY",

  NONCE_OUT_OF_ORDER =
    "NONCE_OUT_OF_ORDER",

  NONCE_OVERFLOW =
    "NONCE_OVERFLOW",
}

/* =========================================
 * NONCE VERIFICATION RESULT
 * =======================================*/

export interface NonceVerificationResult {
  /**
   * Verification success state.
   */
  success: boolean;

  /**
   * Failure code.
   */
  error?:
    NonceVerificationError;

  /**
   * Human-readable diagnostics.
   */
  reason?: string;

  /**
   * Latest accepted nonce.
   */
  latestNonce?: number;

  /**
   * Incoming nonce.
   */
  receivedNonce?: number;
}

/* =========================================
 * NONCE VERIFICATION
 * =======================================*/

/**
 * Validates protocol nonce rules.
 *
 * IMPORTANT:
 * - stateless
 * - deterministic
 * - does NOT store replay state
 *
 * Replay persistence belongs to:
 *
 * replay/
 */
export function verifyNonce(
  envelope: Envelope,

  latestNonce: number,
): NonceVerificationResult {
  try {
    const nonce = envelope.header.nonce;

    /**
     * Must be a number
     */
    if (typeof nonce !== "number" || Number.isNaN(nonce)) {
      return {
        success: false,
        error: NonceVerificationError.INVALID_NONCE,
        reason: "Nonce must be a valid number",
        latestNonce,
        receivedNonce: nonce,
      };
    }
    
    /**
     * Must be an integer (no floats like 44.5)
     */
    if (!Number.isInteger(nonce)) {
      return {
        success: false,
        error: NonceVerificationError.INVALID_NONCE,
        reason: "Nonce must be an integer",
        latestNonce,
        receivedNonce: nonce,
      };
    }
    
    /**
     * Negative check
     */
    if (nonce < 0) {
      return {
        success: false,
        error: NonceVerificationError.INVALID_NONCE,
        reason: "Nonce cannot be negative",
        latestNonce,
        receivedNonce: nonce,
      };
    }
    
    /**
     * Overflow check (NOW VALID AND REACHABLE)
     */
    if (nonce > Number.MAX_SAFE_INTEGER) {
      return {
        success: false,
        error: NonceVerificationError.NONCE_OVERFLOW,
        reason: "Nonce exceeds maximum safe integer",
        latestNonce,
        receivedNonce: nonce,
      };
    }

    /**
     * Validate nonce type.
     */
    if (
      !Number.isSafeInteger(
        nonce,
      )
    ) {
      return {
        success: false,

        error:
          NonceVerificationError.INVALID_NONCE,

        reason:
          "Nonce must be a safe integer",

        latestNonce,

        receivedNonce:
          nonce,
      };
    }

    /**
     * Prevent nonce replay.
     */
    if (
      nonce ===
      latestNonce
    ) {
      return {
        success: false,

        error:
          NonceVerificationError.NONCE_REPLAY,

        reason:
          "Nonce already used",

        latestNonce,

        receivedNonce:
          nonce,
      };
    }

    /**
     * Prevent stale ordering.
     */
    if (
      nonce <
      latestNonce
    ) {
      return {
        success: false,

        error:
          NonceVerificationError.NONCE_OUT_OF_ORDER,

        reason:
          "Nonce older than latest accepted nonce",

        latestNonce,

        receivedNonce:
          nonce,
      };
    }

    /**
     * Successful validation.
     */
    return {
      success: true,

      latestNonce,

      receivedNonce:
        nonce,
    };
  } catch (
    error
  ) {
    return {
      success: false,

      error:
        NonceVerificationError.INVALID_NONCE,

      reason:
        error instanceof Error
          ? error.message
          : "Unknown nonce verification error",
    };
  }
}