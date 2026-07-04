/* =========================================
 * EXECUTION ERROR TYPES
 * =======================================*/

/**
 * Canonical protocol
 * execution failures.
 *
 * These errors MUST remain:
 *
 * - deterministic
 * - serializable
 * - validator-safe
 * - consensus-safe
 */
export enum ExecutionErrorType {
  /**
   * No handler registered
   * for requested action.
   */
  HANDLER_NOT_FOUND =
    "HANDLER_NOT_FOUND",

  /**
   * Payload validation failed.
   */
  INVALID_PAYLOAD =
    "INVALID_PAYLOAD",

  /**
   * Execution handler failed.
   */
  EXECUTION_FAILED =
    "EXECUTION_FAILED",

  /**
   * Execution exceeded
   * allowed runtime.
   */
  EXECUTION_TIMEOUT =
    "EXECUTION_TIMEOUT",

  /**
   * Settlement failure.
   */
  SETTLEMENT_FAILED =
    "SETTLEMENT_FAILED",

  /**
   * State machine failure.
   */
  INVALID_STATE =
    "INVALID_STATE",

  /**
   * Internal runtime failure.
   */
  INTERNAL_ERROR =
    "INTERNAL_ERROR",
}

/* =========================================
 * ERROR SEVERITY
 * =======================================*/

/**
 * Failure severity classification.
 *
 * Used for:
 *
 * - retry systems
 * - orchestration
 * - monitoring
 * - alerting
 * - recovery
 */
export enum ExecutionErrorSeverity {
  /**
   * Recoverable failure.
   */
  LOW =
    "LOW",

  /**
   * Significant execution issue.
   */
  MEDIUM =
    "MEDIUM",

  /**
   * Critical protocol failure.
   */
  HIGH =
    "HIGH",

  /**
   * Fatal protocol condition.
   */
  CRITICAL =
    "CRITICAL",
}

/* =========================================
 * ERROR METADATA
 * =======================================*/

/**
 * Structured execution diagnostics.
 */
export interface ExecutionErrorMetadata {
  /**
   * Optional request identifier.
   */
  requestId?: string;

  /**
   * Optional validator/node identifier.
   */
  validatorId?: string;

  /**
   * Optional execution stage.
   */
  stage?: string;

  /**
   * Arbitrary structured diagnostics.
   */
  details?: unknown;

  action?: string;
}

/* =========================================
 * EXECUTION ERROR
 * =======================================*/

/**
 * Deterministic protocol
 * execution error.
 *
 * Must remain:
 *
 * - serializable
 * - transport-safe
 * - consensus-safe
 */
export class ExecutionError
  extends Error {
  /**
   * Canonical error type.
   */
  readonly type:
    ExecutionErrorType;

  /**
   * Failure severity.
   */
  readonly severity:
    ExecutionErrorSeverity;

  /**
   * Structured diagnostics.
   */
  readonly metadata?:
    ExecutionErrorMetadata;

  /**
   * Deterministic error time.
   */
  readonly timestamp:
    number;

  constructor({
    type,
    message,
    severity =
      ExecutionErrorSeverity.MEDIUM,
    metadata,
    timestamp =
      Date.now(),
  }: {
    type:
      ExecutionErrorType;

    message: string;

    severity?:
      ExecutionErrorSeverity;

    metadata?:
      ExecutionErrorMetadata;

    timestamp?: number;
  }) {
    super(message);

    this.name =
      "ExecutionError";

    this.type =
      type;

    this.severity =
      severity;

    this.metadata =
      metadata;

    this.timestamp =
      timestamp;
  }

  /* =====================================
   * SERIALIZATION
   * ===================================*/

  /**
   * Deterministic error serialization.
   */
  toJSON() {
    return {
      name:
        this.name,

      type:
        this.type,

      message:
        this.message,

      severity:
        this.severity,

      metadata:
        this.metadata,

      timestamp:
        this.timestamp,
    };
  }
}