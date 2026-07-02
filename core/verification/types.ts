/**
 * ---------------------------------------------------------------------
 * Validation Stages
 * ---------------------------------------------------------------------
 * Represents:
 * protocol verification pipeline stages.
 */

export type ValidationStage =
  | "SCHEMA"
  | "TIMESTAMP"
  | "SIGNATURE"
  | "NONCE"
  | "SETTLEMENT"
  | "ATTESTATION"
  | "TRANSPORT";

/**
 * ---------------------------------------------------------------------
 * Validation Reasons
 * ---------------------------------------------------------------------
 *
 * IMPORTANT:
 * deterministic failure semantics.
 */

export type ValidationReason =
  | "VALID"

  /**
   * -------------------------------------------------------------
   * Schema Validation
   * -------------------------------------------------------------
   */
  | "INVALID_SCHEMA"
  | "INVALID_PAYLOAD"
  | "MISSING_REQUIRED_FIELD"

  /**
   * -------------------------------------------------------------
   * Timestamp Validation
   * -------------------------------------------------------------
   */
  | "MISSING_TIMESTAMP"
  | "INVALID_TIMESTAMP"
  | "STALE_TIMESTAMP"
  | "FUTURE_TIMESTAMP"

  /**
   * -------------------------------------------------------------
   * Signature Validation
   * -------------------------------------------------------------
   */
  | "MISSING_SIGNATURE"
  | "INVALID_SIGNATURE"
  | "INVALID_SIGNER"
  | "SIGNATURE_RECOVERY_FAILED"

  /**
   * -------------------------------------------------------------
   * Replay Validation
   * -------------------------------------------------------------
   */
  | "MISSING_NONCE"
  | "INVALID_NONCE"
  | "REPLAY_DETECTED"

  /**
   * -------------------------------------------------------------
   * Settlement Validation
   * -------------------------------------------------------------
   */
  | "INVALID_SETTLEMENT_STATE"
  | "INVALID_TRANSITION"

  /**
   * -------------------------------------------------------------
   * Transport Validation
   * -------------------------------------------------------------
   */
  | "INVALID_PACKET"
  | "INVALID_PACKET_TYPE"
  | "PACKET_TOO_LARGE"

  /**
   * -------------------------------------------------------------
   * Attestation Validation
   * -------------------------------------------------------------
   */
  | "INVALID_ATTESTATION"
  | "INVALID_VERIFIER";

 /**
 * ---------------------------------------------------------------------
 * Validation Severity
 * ---------------------------------------------------------------------
 * Useful for:
 * - monitoring
 * - alerts
 * - metrics
 */

export type ValidationSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL";

/**
 * ---------------------------------------------------------------------
 * Validation Result
 * ---------------------------------------------------------------------
 * Deterministic protocol verification output.
 */

export interface ValidationResult {
  /**
   * -------------------------------------------------------------
   * Final Verification Decision
   * -------------------------------------------------------------
   */

  valid: boolean;

  /**
   * -------------------------------------------------------------
   * Deterministic Validation Reason
   * -------------------------------------------------------------
   */

  reason: ValidationReason;

  /**
   * -------------------------------------------------------------
   * Validation Stage
   * -------------------------------------------------------------
   */

  stage: ValidationStage;

  /**
   * -------------------------------------------------------------
   * Severity Classification
   * -------------------------------------------------------------
   */

  severity:
    ValidationSeverity;

  /**
   * -------------------------------------------------------------
   * Optional Human Context
   * -------------------------------------------------------------
   *
   * Useful for:
   * debugging
   * audits
   * logs
   */

  message?: string;

  /**
   * -------------------------------------------------------------
   * Validation Timestamp
   * -------------------------------------------------------------
   */

  validatedAt: number;
}

/**
 * ---------------------------------------------------------------------
 * Validation Context
 * ---------------------------------------------------------------------
 *
 * Shared verification metadata.
 */

export interface ValidationContext {
  /**
   * -------------------------------------------------------------
   * Validator Identity
   * -------------------------------------------------------------
   */

  validatorId?: string;

  /**
   * -------------------------------------------------------------
   * Node Identity
   * -------------------------------------------------------------
   */

  nodeId?: string;

  /**
   * -------------------------------------------------------------
   * Request Identity
   * -------------------------------------------------------------
   */

  requestId?: string;

  /**
   * -------------------------------------------------------------
   * Transport Packet Identity
   * -------------------------------------------------------------
   */

  packetId?: string;
}

/**
 * ---------------------------------------------------------------------
 * Replay Validation State
 * ---------------------------------------------------------------------
 */

export interface ReplayValidationState {
  sender: string;

  nonce: number;

  processed: boolean;
}

/**
 * ---------------------------------------------------------------------
 * Settlement Validation State
 * ---------------------------------------------------------------------
 */

export interface SettlementValidationState {
  requestId: string;

  currentState: string;

  nextState: string;
}