import {
  MAX_CLOCK_SKEW_MS,
  MAX_FUTURE_DRIFT_MS,
} from "./constants";

import type {
  ValidationResult,
} from "./types";

import {
  TimestampValidationError,
} from "./errors";

/**
 * ---------------------------------------------------------------------
 * Timestamp Validation Options
 * ---------------------------------------------------------------------
 */

export interface TimestampValidationOptions {
  /**
   * -------------------------------------------------------------
   * Override Current Time
   * -------------------------------------------------------------
   * Useful for:
   * deterministic tests.
   */

  now?: number;

  /**
   * -------------------------------------------------------------
   * Maximum Allowed Clock Skew
   * -------------------------------------------------------------
   */

  maxClockSkewMs?: number;

  /**
   * -------------------------------------------------------------
   * Maximum Allowed Future Drift
   * -------------------------------------------------------------
   */

  maxFutureDriftMs?: number;
}

/**
 * ---------------------------------------------------------------------
 * Validate Timestamp
 * ---------------------------------------------------------------------
 * Protects against:
 * - stale packets
 * - replay windows
 * - future-dated requests
 * - invalid timestamps
 */

export function validateTimestamp(
  timestamp: unknown,
  options:
    TimestampValidationOptions =
      {}
): ValidationResult {
  /**
   * -------------------------------------------------------------
   * Resolve Validation Configuration
   * -------------------------------------------------------------
   */

  const now =
    options.now ??
    Date.now();

  const maxClockSkewMs =
    options.maxClockSkewMs ??
    MAX_CLOCK_SKEW_MS;

  const maxFutureDriftMs =
    options.maxFutureDriftMs ??
    MAX_FUTURE_DRIFT_MS;

  /**
   * -------------------------------------------------------------
   * Missing Timestamp
   * -------------------------------------------------------------
   */

  if (
    timestamp === undefined ||
    timestamp === null
  ) {
    throw new TimestampValidationError(
      "MISSING_TIMESTAMP",
      "Timestamp is required"
    );
  }

  /**
   * -------------------------------------------------------------
   * Numeric Validation
   * -------------------------------------------------------------
   */

  if (
    typeof timestamp !==
      "number" ||
    !Number.isFinite(
      timestamp
    )
  ) {
    throw new TimestampValidationError(
      "INVALID_TIMESTAMP",
      "Timestamp must be a finite number"
    );
  }

  /**
   * -------------------------------------------------------------
   * Future Drift Validation
   * -------------------------------------------------------------
   */

  const futureDrift =
    timestamp - now;

  if (
    futureDrift >
    maxFutureDriftMs
  ) {
    throw new TimestampValidationError(
      "FUTURE_TIMESTAMP",
      `Timestamp exceeds allowed future drift of ${maxFutureDriftMs}ms`
    );
  }

  /**
   * -------------------------------------------------------------
   * Staleness Validation
   * -------------------------------------------------------------
   */

  const age =
    now - timestamp;

  if (
    age >
    maxClockSkewMs
  ) {
    throw new TimestampValidationError(
      "STALE_TIMESTAMP",
      `Timestamp exceeds maximum age of ${maxClockSkewMs}ms`
    );
  }

  /**
   * -------------------------------------------------------------
   * Validation Success
   * -------------------------------------------------------------
   */

  return {
    valid: true,

    reason: "VALID",

    stage: "TIMESTAMP",

    severity: "INFO",

    validatedAt: now,

    message:
      "Timestamp validation succeeded",
  };
}

/**
 * ---------------------------------------------------------------------
 * Timestamp Freshness Check
 * ---------------------------------------------------------------------
 *
 * Lightweight freshness helper.
 */

export function isFreshTimestamp(
  timestamp: number,
  maxAgeMs =
    MAX_CLOCK_SKEW_MS
): boolean {
  return (
    Date.now() - timestamp <=
    maxAgeMs
  );
}

/**
 * ---------------------------------------------------------------------
 * Timestamp Age Calculation
 * ---------------------------------------------------------------------
 */

export function getTimestampAge(
  timestamp: number,
  now = Date.now()
): number {
  return now - timestamp;
}

// feature upgrades: validator clock synchronization, ntp drift monitoring, adaptive skew windows, epoch-based freshness, block-height freshness
