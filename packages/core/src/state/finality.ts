import {
  ProtocolState,
} from "./transitions.js";


/* =========================================
 * FINALITY MODE
 * =======================================*/

/**
 * Defines protocol
 * finality guarantees.
 */
export enum FinalityMode {
  /**
   * Single validator approval.
   */
  SINGLE =
    "SINGLE",

  /**
   * Majority validator quorum.
   */
  MAJORITY =
    "MAJORITY",

  /**
   * Weighted validator threshold.
   */
  WEIGHTED =
    "WEIGHTED",

  /**
   * Unanimous validator agreement.
   */
  UNANIMOUS =
    "UNANIMOUS",
}

/* =========================================
 * FINALITY STATUS
 * =======================================*/

export enum FinalityStatus {
  PENDING =
    "PENDING",

  FINALIZED =
    "FINALIZED",

  REJECTED =
    "REJECTED",
}

/* =========================================
 * FINALITY CONFIG
 * =======================================*/

export interface FinalityConfig {
  /**
   * Finality strategy.
   */
  mode:
    FinalityMode;

  /**
   * Minimum validator approvals.
   */
  threshold:
    number;

  /**
   * Optional validator weights.
   */
  weights?:
    Readonly<
      Record<string, number>
    >;
}

/* =========================================
 * QUORUM RESULT
 * =======================================*/

export interface QuorumResult {
  /**
   * Finality success state.
   */
  success:
    boolean;

  /**
   * Finality lifecycle.
   */
  status:
    FinalityStatus;

  /**
   * Total attestations.
   */
  approvals:
    number;

  /**
   * Required threshold.
   */
  threshold:
    number;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * FINALITY ENGINE
 * =======================================*/

export class FinalityEngine {
  /**
   * Deterministic finality config.
   */
  private readonly config:
    FinalityConfig;

  constructor(
    config:
      FinalityConfig,
  ) {
    this.config =
      Object.freeze({
        ...config,
      });
  }


  /* =========================================
   * QUORUM VALIDATION
   * =======================================*/
  
  /**
   * Evaluates validator quorum
   * against configured finality rules.
   *
   * Supports:
   *
   * - SINGLE
   * - MAJORITY
   * - WEIGHTED
   * - UNANIMOUS
   */
  evaluate(
    validators:
      readonly string[],
  ): QuorumResult {

    /* =====================================
 * FINALIZED STATE LOGIC
 * ===================================*/

  /**
   * Total validator approvals.
   */
  const approvals =
    validators.length;

  /**
   * Required threshold.
   */
  const threshold =
    this.config.threshold;

  /* =====================================
   * SINGLE VALIDATOR FINALITY
   * ===================================*/

  if (
    this.config.mode ===
    FinalityMode.SINGLE
  ) {

    const success =
      approvals >= 1;

    return {
      success,

      status:
        success
          ? FinalityStatus.FINALIZED
          : FinalityStatus.PENDING,

      approvals,

      threshold: 1,

      reason:
        success
          ? undefined
          : "No validator approval received",
    };
  }

  /* =====================================
   * MAJORITY FINALITY
   * ===================================*/

  if (
    this.config.mode ===
    FinalityMode.MAJORITY
  ) {

    /**
     * Majority threshold.
     *
     * Example:
     *
     * 5 validators
     * -> 3 required
     */
    const required =
      Math.floor(
        threshold / 2,
      ) + 1;

    const success =
      approvals >= required;

    return {
      success,

      status:
        success
          ? FinalityStatus.FINALIZED
          : FinalityStatus.PENDING,

      approvals,

      threshold:
        required,

      reason:
        success
          ? undefined
          : "Majority quorum not reached",
    };
  }

  /* =====================================
   * WEIGHTED FINALITY
   * ===================================*/

  if (
    this.config.mode ===
    FinalityMode.WEIGHTED
  ) {

    /**
     * Validator weights.
     */
    const weights =
      this.config.weights ?? {};

    /**
     * Total accumulated weight.
     */
    let totalWeight =
      0;

    for (
      const validator
      of validators
    ) {

      totalWeight +=
        weights[
          validator
        ] ?? 0;
    }

    const success =
      totalWeight >=
      threshold;

    return {
      success,

      status:
        success
          ? FinalityStatus.FINALIZED
          : FinalityStatus.PENDING,

      approvals:
        totalWeight,

      threshold,

      reason:
        success
          ? undefined
          : "Weighted quorum threshold not reached",
    };
  }

  /* =====================================
   * UNANIMOUS FINALITY
   * ===================================*/

  if (
    this.config.mode ===
    FinalityMode.UNANIMOUS
  ) {

    const success =
      approvals ===
      threshold;

    return {
      success,

      status:
        success
          ? FinalityStatus.FINALIZED
          : FinalityStatus.PENDING,

      approvals,

      threshold,

      reason:
        success
          ? undefined
          : "Unanimous validator approval required",
    };
  }

  /* =====================================
   * INVALID MODE
   * ===================================*/

  return {
    success: false,

    status:
      FinalityStatus.REJECTED,

    approvals,

    threshold,

    reason:
      "Unsupported finality mode",
  };
}


/* =====================================
 * FINALIZED STATE LOGIC
 * ===================================*/

finalize(
  currentState:
    ProtocolState,

  quorum:
    QuorumResult,
): ProtocolState {

  /* =====================================
   * ONLY SETTLED REQUESTS
   * CAN FINALIZE
   * ===================================*/

  if (
    currentState !==
    ProtocolState.SETTLED
  ) {
    return currentState;
  }

  /* =====================================
   * FINALITY SUCCESS
   * ===================================*/

  if (
    quorum.success
  ) {
    return (
      ProtocolState.FINALIZED
    );
  }

  /* =====================================
   * HARD FAILURE
   * ===================================*/

  if (
    quorum.status ===
    FinalityStatus.REJECTED
  ) {
    return (
      ProtocolState.REJECTED
    );
  }

  /* =====================================
   * QUORUM PENDING
   * ===================================*/

  return (
    ProtocolState.SETTLED
  );
}
}