import type {
  Envelope,
} from "../base/envelope.js";

import type {
HashDigest,
} from "../base/primitives.js";


import type {
  ProtocolState,
} from "../state/transitions.js";

/* =========================================
 * EXECUTION STATUS
 * =======================================*/

/**
 * Deterministic execution outcome.
 *
 * Represents the final execution
 * result BEFORE settlement finalization.
 */
export enum ExecutionStatus {
  /**
   * Execution completed successfully.
   */
  SUCCESS =
    "SUCCESS",

  /**
   * Execution failed.
   */
  FAILURE =
    "FAILURE",
}

/* =========================================
 * EXECUTION ERROR CODES
 * =======================================*/

/**
 * Canonical execution failures.
 *
 * Used for:
 *
 * - diagnostics
 * - settlement classification
 * - validator synchronization
 * - receipt generation
 * - observability
 */
export enum ExecutionErrorCode {
  /**
   * No execution handler found.
   */
  HANDLER_NOT_FOUND =
    "HANDLER_NOT_FOUND",

  /**
   * Handler execution failed.
   */
  EXECUTION_FAILED =
    "EXECUTION_FAILED",

  /**
   * Invalid execution payload.
   */
  INVALID_PAYLOAD =
    "INVALID_PAYLOAD",

  /**
   * Execution timed out.
   */
  EXECUTION_TIMEOUT =
    "EXECUTION_TIMEOUT",

  /**
   * Internal protocol error.
   */
  INTERNAL_ERROR =
    "INTERNAL_ERROR",
}

/* =========================================
 * BASE EXECUTION RESULT
 * =======================================*/

/**
 * Canonical execution result.
 *
 * Shared across:
 *
 * - executors
 * - settlement engines
 * - validators
 * - orchestrators
 * - receipt generators
 */
export interface BaseExecutionResult {
  /**
   * Execution success state.
   */
  success: boolean;

  /**
   * Deterministic request digest.
   */
  digest:
    HashDigest;

  /**
   * Canonical protocol envelope.
   */
  envelope:
    Envelope;

  /**
   * Execution lifecycle state.
   */
  state:
    ProtocolState;

  /**
   * Execution outcome.
   */
  status:
    ExecutionStatus;

  /**
   * Deterministic execution time.
   */
  executedAt:
    number;

  /**
   * Total execution duration.
   */
  durationMs:
    number;
}

/* =========================================
 * SUCCESS RESULT
 * =======================================*/

/**
 * Successful execution output.
 */
export interface ExecutionSuccessResult
  extends BaseExecutionResult {
  success: true;

  status:
    ExecutionStatus.SUCCESS;

  /**
   * Deterministic execution result.
   */
  result:
    unknown;
}

/* =========================================
 * FAILURE RESULT
 * =======================================*/

/**
 * Failed execution output.
 */
export interface ExecutionFailureResult
  extends BaseExecutionResult {
  success: false;

  status:
    ExecutionStatus.FAILURE;

  /**
   * Canonical failure code.
   */
  errorCode:
    ExecutionErrorCode;

  /**
   * Human-readable diagnostics.
   */
  errorMessage:
    string;

  /**
   * Optional structured error data.
   */
  errorDetails?:
    unknown;
}

/* =========================================
 * UNION RESULT TYPE
 * =======================================*/

/**
 * Deterministic protocol
 * execution result.
 */
export type ExecutionResult =
  | ExecutionSuccessResult
  | ExecutionFailureResult;