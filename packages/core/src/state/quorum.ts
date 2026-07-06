import type {
  AttestationReceipt,
  ValidatorId,
} from "../execution/request-attestation.js";

import {
  protocolHash,
} from "../crypto/hashing.js";

/* =========================================
 * QUORUM STATUS
 * =======================================*/

/**
 * Canonical quorum lifecycle.
 */
export enum QuorumStatus {
  /**
   * Quorum not reached yet.
   */
  PENDING =
    "PENDING",

  /**
   * Required quorum reached.
   */
  REACHED =
    "REACHED",

  /**
   * Quorum validation failed.
   */
  FAILED =
    "FAILED",
}

/* =========================================
 * QUORUM MEMBER
 * =======================================*/

/**
 * Canonical validator quorum member.
 */
export interface QuorumMember {
  /**
   * Validator identity.
   */
  validator:
    ValidatorId;

  /**
   * Validator voting weight.
   */
  weight:
    number;
}

/* =========================================
 * QUORUM CONFIG
 * =======================================*/

/**
 * Deterministic quorum configuration.
 */
export interface QuorumConfig {
  /**
   * Minimum validator approvals.
   */
  threshold:
    number;

  /**
   * Validator registry.
   */
  validators:
    readonly QuorumMember[];

  /**
   * Allow weighted quorum.
   */
  weighted?:
    boolean;
}

/* =========================================
 * QUORUM RESULT
 * =======================================*/

/**
 * Deterministic quorum evaluation result.
 */
export interface QuorumEvaluationResult {
  /**
   * Quorum success state.
   */
  success:
    boolean;

  /**
   * Canonical quorum lifecycle.
   */
  status:
    QuorumStatus;

  /**
   * Unique validator approvals.
   */
  approvals:
    number;

  /**
   * Aggregated validator weight.
   */
  totalWeight:
    number;

  /**
   * Required quorum threshold.
   */
  threshold:
    number;

  /**
   * Deterministic quorum hash.
   */
  quorumHash:
    string;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * QUORUM ENGINE
 * =======================================*/

/**
 * Deterministic validator
 * quorum aggregation engine.
 *
 * Responsible for:
 *
 * - validator uniqueness
 * - duplicate prevention
 * - weighted quorum
 * - threshold validation
 * - attestation aggregation
 */
export class QuorumEngine {
  /**
   * Immutable quorum config.
   */
  private readonly config:
    QuorumConfig;

  constructor(
    config:
      QuorumConfig,
  ) {
    this.config =
      Object.freeze({
        ...config,
      });
  }

  /* =====================================
   * QUORUM EVALUATION
   * ===================================*/

  /**
   * Evaluates validator attestations.
   */
  evaluate(
    attestations:
      readonly AttestationReceipt[],
  ): QuorumEvaluationResult {

    /**
     * Unique validator set.
     */
    const validators =
      new Set<
        ValidatorId
      >();

    /**
     * Total validator weight.
     */
    let totalWeight =
      0;

    /* ===================================
     * PROCESS ATTESTATIONS
     * =================================*/

    for (
      const attestation
      of attestations
    ) {

      /**
       * Prevent duplicate validators.
       */
      if (
        validators.has(
          attestation.validator,
        )
      ) {
        continue;
      }

      validators.add(
        attestation.validator,
      );

      /**
       * Resolve validator weight.
       */
      const member =
        this.config.validators.find(
          (
            validator,
          ) =>
            validator.validator ===
            attestation.validator,
        );

      if (
        !member
      ) {
        continue;
      }

      totalWeight +=
        member.weight;
    }

    /* ===================================
     * FINAL COUNTS
     * =================================*/

    const approvals =
      validators.size;

    const threshold =
      this.config.threshold;

    /* ===================================
     * WEIGHTED QUORUM
     * =================================*/

    if (
      this.config.weighted
    ) {

      const success =
        totalWeight >=
        threshold;

      return {
        success,

        status:
          success
            ? QuorumStatus.REACHED
            : QuorumStatus.PENDING,

        approvals,

        totalWeight,

        threshold,

        quorumHash:
          protocolHash(
            JSON.stringify(
              attestations,
            ),
          ),

        reason:
          success
            ? undefined
            : "Weighted quorum threshold not reached",
      };
    }

    /* ===================================
     * STANDARD QUORUM
     * =================================*/

    const success =
      approvals >=
      threshold;

    return {
      success,

      status:
        success
          ? QuorumStatus.REACHED
          : QuorumStatus.PENDING,

      approvals,

      totalWeight,

      threshold,

      quorumHash:
        protocolHash(
          JSON.stringify(
            attestations,
          ),
        ),

      reason:
        success
          ? undefined
          : "Validator quorum not reached",
    };
  }
}