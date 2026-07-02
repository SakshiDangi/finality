import type {
  ValidationReason,
  ValidationStage,
  ValidationSeverity,
} from "./types";

/**
 * ---------------------------------------------------------------------
 * Base Verification Error
 * ---------------------------------------------------------------------
 */

export class VerificationError
  extends Error {
  /**
   * -------------------------------------------------------------
   * Deterministic Validation Reason
   * -------------------------------------------------------------
   */

  public readonly reason:
    ValidationReason;

  /**
   * -------------------------------------------------------------
   * Validation Stage
   * -------------------------------------------------------------
   */

  public readonly stage:
    ValidationStage;

  /**
   * -------------------------------------------------------------
   * Severity Classification
   * -------------------------------------------------------------
   */

  public readonly severity:
    ValidationSeverity;

  /**
   * -------------------------------------------------------------
   * Validation Timestamp
   * -------------------------------------------------------------
   */

  public readonly timestamp:
    number;

  constructor(
    message: string,
    reason: ValidationReason,
    stage: ValidationStage,
    severity:
      ValidationSeverity =
        "CRITICAL"
  ) {
    super(message);

    this.name =
      "VerificationError";

    this.reason = reason;

    this.stage = stage;

    this.severity =
      severity;

    this.timestamp =
      Date.now();
  }
}

/**
 * ---------------------------------------------------------------------
 * Schema Validation Error
 * ---------------------------------------------------------------------
 */

export class SchemaValidationError
  extends VerificationError {
  constructor(
    message =
      "Invalid request schema"
  ) {
    super(
      message,
      "INVALID_SCHEMA",
      "SCHEMA",
      "CRITICAL"
    );

    this.name =
      "SchemaValidationError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Timestamp Validation Error
 * ---------------------------------------------------------------------
 */

export class TimestampValidationError
  extends VerificationError {
  constructor(
    reason:
      | "MISSING_TIMESTAMP"
      | "INVALID_TIMESTAMP"
      | "STALE_TIMESTAMP"
      | "FUTURE_TIMESTAMP",
    message =
      "Invalid timestamp"
  ) {
    super(
      message,
      reason,
      "TIMESTAMP",
      "CRITICAL"
    );

    this.name =
      "TimestampValidationError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Signature Validation Error
 * ---------------------------------------------------------------------
 */

export class SignatureValidationError
  extends VerificationError {
  constructor(
    reason:
      | "MISSING_SIGNATURE"
      | "INVALID_SIGNATURE"
      | "INVALID_SIGNER"
      | "SIGNATURE_RECOVERY_FAILED",
    message =
      "Signature verification failed"
  ) {
    super(
      message,
      reason,
      "SIGNATURE",
      "CRITICAL"
    );

    this.name =
      "SignatureValidationError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Replay Validation Error
 * ---------------------------------------------------------------------
 */

export class ReplayValidationError
  extends VerificationError {
  constructor(
    reason:
      | "MISSING_NONCE"
      | "INVALID_NONCE"
      | "REPLAY_DETECTED",
    message =
      "Replay validation failed"
  ) {
    super(
      message,
      reason,
      "NONCE",
      "CRITICAL"
    );

    this.name =
      "ReplayValidationError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Settlement Validation Error
 * ---------------------------------------------------------------------
 */

export class SettlementValidationError
  extends VerificationError {
  constructor(
    reason:
      | "INVALID_SETTLEMENT_STATE"
      | "INVALID_TRANSITION",
    message =
      "Settlement validation failed"
  ) {
    super(
      message,
      reason,
      "SETTLEMENT",
      "CRITICAL"
    );

    this.name =
      "SettlementValidationError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Transport Validation Error
 * ---------------------------------------------------------------------
 */

export class TransportValidationError
  extends VerificationError {
  constructor(
    reason:
      | "INVALID_PACKET"
      | "INVALID_PACKET_TYPE"
      | "PACKET_TOO_LARGE",
    message =
      "Transport validation failed"
  ) {
    super(
      message,
      reason,
      "TRANSPORT",
      "CRITICAL"
    );

    this.name =
      "TransportValidationError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Attestation Validation Error
 * ---------------------------------------------------------------------
 */

export class AttestationValidationError
  extends VerificationError {
  constructor(
    reason:
      | "INVALID_ATTESTATION"
      | "INVALID_VERIFIER",
    message =
      "Attestation validation failed"
  ) {
    super(
      message,
      reason,
      "ATTESTATION",
      "CRITICAL"
    );

    this.name =
      "AttestationValidationError";
  }
}