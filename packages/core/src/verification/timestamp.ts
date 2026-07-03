import {
  Envelope,
} from "../base/envelope.js";

/* =========================================
 * TIMESTAMP VERIFICATION ERRORS
 * =======================================*/

export enum TimestampVerificationError {
  INVALID_TIMESTAMP =
    "INVALID_TIMESTAMP",

  MESSAGE_EXPIRED =
    "MESSAGE_EXPIRED",

  FUTURE_TIMESTAMP =
    "FUTURE_TIMESTAMP",

  INVALID_TTL =
    "INVALID_TTL",
}

/* =========================================
 * TIMESTAMP VERIFICATION OPTIONS
 * =======================================*/

export interface TimestampVerificationOptions {
  /**
   * Maximum allowed future
   * clock drift in milliseconds.
   */
  maxFutureDriftMs: number;

  /**
   * Minimum allowed TTL.
   */
  minTTL: number;

  /**
   * Maximum allowed TTL.
   */
  maxTTL: number;
}

/* =========================================
 * VERIFICATION RESULT
 * =======================================*/

export interface TimestampVerificationResult {
  /**
   * Verification success state.
   */
  success: boolean;

  /**
   * Failure code.
   */
  error?:
    TimestampVerificationError;

  /**
   * Human-readable diagnostics.
   */
  reason?: string;

  /**
   * Envelope age in milliseconds.
   */
  ageMs?: number;

  /**
   * Expiration timestamp.
   */
  expiresAt?: number;
}

/* =========================================
 * DEFAULT OPTIONS
 * =======================================*/

export const DEFAULT_TIMESTAMP_OPTIONS:
  TimestampVerificationOptions = {
  /**
   * Allow 30s clock skew.
   */
  maxFutureDriftMs:
    30_000,

  /**
   * Minimum 1 second TTL.
   */
  minTTL:
    1_000,

  /**
   * Maximum 5 minute TTL.
   */
  maxTTL:
    5 * 60 * 1000,
};

/* =========================================
 * TIMESTAMP VERIFICATION
 * =======================================*/

/**
 * Validates temporal
 * trust boundaries.
 *
 * Validation flow:
 *
 * - validate timestamp
 * - validate ttl range
 * - validate future drift
 * - validate expiration
 */
export function verifyTimestamp(
  envelope: Envelope,

  currentTime: number,

  options:
    TimestampVerificationOptions =
      DEFAULT_TIMESTAMP_OPTIONS,
): TimestampVerificationResult {
  try {
    const {
      timestamp,
      ttl,
    } = envelope.header;

    /**
     * Validate timestamp.
     */
    if (
      !Number.isFinite(
        timestamp,
      ) ||
      timestamp < 0
    ) {
      return {
        success: false,

        error:
          TimestampVerificationError.INVALID_TIMESTAMP,

        reason:
          "Invalid envelope timestamp",
      };
    }

    /**
     * Validate TTL range.
     */
    if (
      ttl <
        options.minTTL ||
      ttl >
        options.maxTTL
    ) {
      return {
        success: false,

        error:
          TimestampVerificationError.INVALID_TTL,

        reason:
          "Envelope TTL outside allowed range",
      };
    }

    /**
     * Prevent excessive
     * future timestamps.
     */
    const futureDrift =
      timestamp -
      currentTime;

    if (
      futureDrift >
      options.maxFutureDriftMs
    ) {
      return {
        success: false,

        error:
          TimestampVerificationError.FUTURE_TIMESTAMP,

        reason:
          "Envelope timestamp exceeds allowed future drift",
      };
    }

    /**
     * Expiration boundary.
     */
    const expiresAt =
      timestamp + ttl;

    /**
     * Message age.
     */
    const ageMs =
      currentTime -
      timestamp;

    /**
     * Reject expired requests.
     */
    if (
      currentTime >
      expiresAt
    ) {
      return {
        success: false,

        error:
          TimestampVerificationError.MESSAGE_EXPIRED,

        reason:
          "Envelope timestamp expired",

        ageMs,

        expiresAt,
      };
    }

    /**
     * Successful validation.
     */
    return {
      success: true,

      ageMs,

      expiresAt,
    };
  } catch (
    error
  ) {
    return {
      success: false,

      error:
        TimestampVerificationError.INVALID_TIMESTAMP,

      reason:
        error instanceof Error
          ? error.message
          : "Unknown timestamp verification error",
    };
  }
}