import {
  protocolHash,
} from "../crypto/hashing.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import {
  ProtocolState,
} from "../state/transitions.js";

import {
  SettlementStatus,
} from "../state/settlement.js";

import type {
  ExecutionContext,
} from "./context.js";

import {
  ExecutionError,
  ExecutionErrorType,
} from "./errors.js";

import type {
  ExecutionResult,
} from "./result.js";

/* =========================================
 * SETTLEMENT RECEIPT
 * =======================================*/

export interface SettlementReceipt {
  /**
   * Request digest.
   */
  digest: HashDigest;

  /**
   * Settlement success.
   */
  success: boolean;

  /**
   * Settlement timestamp.
   */
  settledAt: number;

  /**
   * Final protocol state.
   */
  state: ProtocolState;

  /**
   * Execution snapshot.
   */
  execution: ExecutionResult;
}

/* =========================================
 * SETTLEMENT RESULT
 * =======================================*/

export interface SettlementResult {
  /**
   * Settlement success.
   */
  success: boolean;

  /**
   * Receipt hash.
   */
  settlementHash: HashDigest;

  /**
   * Immutable receipt.
   */
  receipt: SettlementReceipt;

  /**
   * Failure reason.
   */
  reason?: string;
}

/* =========================================
 * REQUEST SETTLEMENT
 * =======================================*/

export async function settleRequest(
  context: ExecutionContext,
  execution: ExecutionResult,
): Promise<SettlementResult> {

  const {
    stateMachine,
    settlement,
  } = context;

  try {

    /* =====================================
     * STEP 1
     * VERIFY EXECUTION
     * ===================================*/

    if (!execution.success) {
      throw new ExecutionError({
        type:
          ExecutionErrorType.SETTLEMENT_FAILED,

        message:
          "Cannot settle failed execution",
      });
    }

    /* =====================================
     * STEP 2
     * ENTER SETTLED STATE
     * ===================================*/

    const transition =
      stateMachine.transition(
        ProtocolState.SETTLED,
      );

    if (!transition.success) {
      throw new ExecutionError({
        type:
          ExecutionErrorType.INVALID_STATE,

        message:
          transition.reason ??
          "Invalid settlement transition",
      });
    }

    /* =====================================
     * STEP 3
     * BUILD RECEIPT
     * ===================================*/

    const settledAt =
      Date.now();

    const receipt: SettlementReceipt = {
      digest:
        execution.digest,

      success:
        true,

      settledAt,

      state:
        ProtocolState.SETTLED,

      execution,
    };

    /* =====================================
     * STEP 4
     * HASH RECEIPT
     * ===================================*/

    const settlementHash =
      protocolHash(
        JSON.stringify(
          receipt,
        ),
      );

    /* =====================================
     * STEP 5
     * PERSIST RECORD
     * ===================================*/

    await settlement.persist({

      digest:
        execution.digest,

      envelope:
        execution.envelope,

      state:
        ProtocolState.SETTLED,

      status:
        SettlementStatus.SUCCESS,

      result:
        execution.result,

      settledAt,
    });

    /* =====================================
     * RESULT
     * ===================================*/

    return {

      success: true,

      settlementHash,

      receipt,

    };

  } catch (error) {

    const settledAt =
      Date.now();

    return {

      success: false,

      settlementHash:
        protocolHash(
          "SETTLEMENT_FAILURE",
        ),

      receipt: {

        digest:
          execution.digest,

        success: false,

        settledAt,

        state:
          stateMachine.getState(),

        execution,

      },

      reason:
        error instanceof Error
          ? error.message
          : "Unknown settlement failure",

    };

  }

}