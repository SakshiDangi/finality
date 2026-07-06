import type {
  EnvelopePayload,
} from "../base/envelope.js";

import type {
  ExecutionContext,
} from "./context.js";

import {
  ExecutionError,
  ExecutionErrorType,
} from "./errors.js";

import {
  ExecutionStatus,
  ExecutionErrorCode,
  type ExecutionResult,
  type ExecutionSuccessResult,
  type ExecutionFailureResult,
} from "./result.js";

import {
  ProtocolState,
} from "../state/transitions.js";

/* =========================================
 * EXECUTION PAYLOAD
 * =======================================*/

/**
 * Canonical executable payload.
 *
 * Runtime actions MUST include:
 *
 * - action
 * - arbitrary execution data
 */
export interface ExecutablePayload
  extends EnvelopePayload {
  /**
   * Deterministic execution action.
   */
  action:
    string;
}

/* =========================================
 * EXECUTION OPTIONS
 * =======================================*/

/**
 * Runtime execution configuration.
 */
export interface RequestExecutorOptions {
  /**
   * Maximum allowed execution time.
   */
  timeoutMs?:
    number;
}

/* =========================================
 * REQUEST EXECUTOR
 * =======================================*/

/**
 * Executes deterministic
 * protocol runtime actions.
 *
 * Flow:
 *
 * envelope
 * -> resolve action
 * -> resolve handler
 * -> execute handler
 * -> produce execution result
 * -> advance state machine
 */
export async function executeRequest(
  context:
    ExecutionContext,

  options:
    RequestExecutorOptions = {},
): Promise<
  ExecutionResult
> {
  /**
   * Deterministic execution start.
   */
  const startedAt =
    Date.now();

  const {
    envelope,
    digest,
    handlers,
    stateMachine,
  } = context;

  try {
    /* =====================================
     * STEP 1
     * ENTER EXECUTING STATE
     * ===================================*/

    stateMachine.transition(
      ProtocolState.EXECUTING,
    );

    /* =====================================
     * STEP 2
     * EXTRACT PAYLOAD
     * ===================================*/

    const payload =
      envelope.payload as ExecutablePayload;

    const action =
      payload.action;

    /**
     * Validate action.
     */
    if (
      !action ||
      typeof action !== "string"
    ) {
      throw new ExecutionError({
        type:
          ExecutionErrorType.INVALID_PAYLOAD,

        message:
          "Execution payload missing action",
      });
    }

    /* =====================================
     * STEP 3
     * RESOLVE HANDLER
     * ===================================*/

    const handler =
      handlers.get(
        action,
      );

    /**
     * Reject unknown handlers.
     */
    if (
      !handler
    ) {
      throw new ExecutionError({
        type:
          ExecutionErrorType.HANDLER_NOT_FOUND,

        message:
          `No execution handler registered for action: ${action}`,

        metadata: {
          action,
        },
      });
    }

    /* =====================================
     * STEP 4
     * EXECUTE HANDLER
     * ===================================*/

    const result =
      await handler(
        context,
        payload,
      );

    /* =====================================
     * STEP 5
     * ENTER EXECUTED STATE
     * ===================================*/

    stateMachine.transition(
      ProtocolState.EXECUTED,
    );

    /**
     * Deterministic execution end.
     */
    const executedAt =
      Date.now();

    /* =====================================
     * SUCCESS RESULT
     * ===================================*/

    const executionResult:
      ExecutionSuccessResult = {
      success: true,

      digest,

      envelope,

      state:
        ProtocolState.EXECUTED,

      status:
        ExecutionStatus.SUCCESS,

      executedAt,

      durationMs:
        executedAt -
        startedAt,

      result,
    };

    return executionResult;
  } catch (
    error
  ) {
    /**
     * Deterministic execution end.
     */
    const executedAt =
      Date.now();

    /* =====================================
     * EXECUTION ERROR
     * ===================================*/

    if (
      error instanceof ExecutionError
    ) {
      const failure:
        ExecutionFailureResult = {
        success: false,

        digest,

        envelope,

        state:
          stateMachine.getState(),

        status:
          ExecutionStatus.FAILURE,

        executedAt,

        durationMs:
          executedAt -
          startedAt,

        errorCode:
          mapExecutionErrorCode(
            error.type,
          ),

        errorMessage:
          error.message,

        errorDetails:
          error.metadata,
      };

      return failure;
    }

    /* =====================================
     * UNKNOWN ERROR
     * ===================================*/

    const failure:
      ExecutionFailureResult = {
      success: false,

      digest,

      envelope,

      state:
        stateMachine.getState(),

      status:
        ExecutionStatus.FAILURE,

      executedAt,

      durationMs:
        executedAt -
        startedAt,

      errorCode:
        ExecutionErrorCode.INTERNAL_ERROR,

      errorMessage:
        error instanceof Error
          ? error.message
          : "Unknown execution failure",
    };

    return failure;
  }
}

/* =========================================
 * ERROR CODE MAPPING
 * =======================================*/

/**
 * Maps runtime execution errors
 * into canonical protocol
 * execution result codes.
 */
function mapExecutionErrorCode(
  type:
    ExecutionErrorType,
): ExecutionErrorCode {
  switch (type) {
    case ExecutionErrorType.HANDLER_NOT_FOUND:
      return ExecutionErrorCode.HANDLER_NOT_FOUND;

    case ExecutionErrorType.INVALID_PAYLOAD:
      return ExecutionErrorCode.INVALID_PAYLOAD;

    case ExecutionErrorType.EXECUTION_TIMEOUT:
      return ExecutionErrorCode.EXECUTION_TIMEOUT;

    case ExecutionErrorType.EXECUTION_FAILED:
      return ExecutionErrorCode.EXECUTION_FAILED;

    default:
      return ExecutionErrorCode.INTERNAL_ERROR;
  }
}