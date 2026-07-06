import {
  ProtocolState,
} from "./transitions.js";

import {
  FinalityEngine,
  FinalityMode,
  FinalityStatus,
} from "./finality.js";

import type {
  QuorumResult,
} from "./finality.js";

import type {
  ValidatorSet,
} from "./validator-set.js";


/* =========================================
 * CONSENSUS RESULT
 * =======================================*/

/**
 * Deterministic consensus result.
 *
 * Represents validator quorum
 * evaluation outcome.
 */
export interface ConsensusResult {
  /**
   * Consensus success state.
   */
  success:
    boolean;

  /**
   * Final protocol state.
   */
  state:
    ProtocolState;

  /**
   * Evaluated quorum result.
   */
  quorum:
    QuorumResult;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * CONSENSUS CONTEXT
 * =======================================*/

/**
 * Consensus runtime dependencies.
 */
export interface ConsensusContext {
  /**
   * Active validator set.
   */
  validatorSet:
    ValidatorSet;
}

/* =========================================
 * CONSENSUS ENGINE
 * =======================================*/

/**
 * Deterministic consensus engine.
 *
 * Responsible for:
 *
 * - validator quorum evaluation
 * - finality enforcement
 * - distributed agreement
 * - settlement finalization
 */
export class ConsensusEngine {
  /**
   * Runtime dependencies.
   */
  private readonly context:
    ConsensusContext;

  /**
   * Finality evaluation engine.
   */
  private readonly finality:
    FinalityEngine;

  /**
   * Create consensus engine.
   */
  constructor(
    context:
      ConsensusContext,
  ) {
    this.context =
      Object.freeze({
        ...context,
      });

    /**
     * Configure deterministic
     * finality evaluation.
     */
    this.finality =
      new FinalityEngine({
        mode:
          FinalityMode.MAJORITY,

        threshold:
          context
            .validatorSet
            .size(),
      });
  }

  /* =====================================
   * CONSENSUS EVALUATION
   * ===================================*/

  /**
   * Evaluates validator consensus.
   *
   * Flow:
   *
   * validator approvals
   * -> quorum evaluation
   * -> finality resolution
   * -> protocol state transition
   */
  evaluate(
    validators:
      readonly string[],

    currentState:
      ProtocolState,
  ): ConsensusResult {

    /* ===================================
     * QUORUM VALIDATION
     * =================================*/

    const quorum =
      this.finality.evaluate(
        validators,
      );

    /* ===================================
     * FINALITY STATE
     * =================================*/

    const nextState =
      this.finality.finalize(
        currentState,
        quorum,
      );

    /* ===================================
     * CONSENSUS SUCCESS
     * =================================*/

    if (
      quorum.status ===
      FinalityStatus.FINALIZED
    ) {
      return {
        success: true,

        state:
          nextState,

        quorum,
      };
    }

    /* ===================================
     * CONSENSUS REJECTED
     * =================================*/

    if (
      quorum.status ===
      FinalityStatus.REJECTED
    ) {
      return {
        success: false,

        state:
          nextState,

        quorum,

        reason:
          quorum.reason,
      };
    }

    /* ===================================
     * CONSENSUS PENDING
     * =================================*/

    return {
      success: false,

      state:
        nextState,

      quorum,

      reason:
        "Consensus threshold not reached",
    };
  }
}