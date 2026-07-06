import {
  protocolHash,
} from "../crypto/hashing.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  ReplayRecord,
} from "../storage/replay-store.js";

import type {
  AttestationRecord,
} from "../storage/attestation-store.js";

/* =========================================
 * CHECKPOINT STATE
 * =======================================*/

/**
 * Canonical synchronization
 * checkpoint lifecycle.
 */
export enum CheckpointStatus {
  /**
   * Snapshot still mutable.
   */
  PENDING =
    "PENDING",

  /**
   * Snapshot sealed.
   */
  FINALIZED =
    "FINALIZED",
}

/* =========================================
 * CHECKPOINT SNAPSHOT
 * =======================================*/

/**
 * Immutable distributed
 * synchronization checkpoint.
 *
 * Used for:
 *
 * - replay synchronization
 * - validator reconciliation
 * - distributed recovery
 * - state restoration
 */
export interface CheckpointSnapshot {
  /**
   * Deterministic checkpoint hash.
   */
  checkpointId:
    HashDigest;

  /**
   * Snapshot sequence height.
   */
  height:
    number;

  /**
   * Replay records.
   */
  replays:
    readonly ReplayRecord[];

  /**
   * Attestation records.
   */
  attestations:
    readonly AttestationRecord[];

  /**
   * Checkpoint lifecycle.
   */
  status:
    CheckpointStatus;

  /**
   * Snapshot creation time.
   */
  createdAt:
    number;
}

/* =========================================
 * CHECKPOINT RESULT
 * =======================================*/

export interface CheckpointResult {
  /**
   * Operation success state.
   */
  success:
    boolean;

  /**
   * Produced checkpoint.
   */
  checkpoint?:
    CheckpointSnapshot;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * CHECKPOINT ENGINE
 * =======================================*/

/**
 * Deterministic synchronization
 * checkpoint engine.
 *
 * Responsible for:
 *
 * - distributed snapshots
 * - validator synchronization
 * - replay persistence
 * - recovery coordination
 */
export class CheckpointEngine {
  /**
   * Internal checkpoint height.
   */
  private height =
    0;

  /**
   * Creates deterministic
   * synchronization checkpoint.
   */
  create(
    replays:
      readonly ReplayRecord[],

    attestations:
      readonly AttestationRecord[],
  ): CheckpointResult {

    try {

      const nextHeight =
        this.height + 1;

      const checkpointHash =
        protocolHash(
          JSON.stringify({
            height:
              nextHeight,

            replays,

            attestations,
          }),
        );

      const checkpoint:
        CheckpointSnapshot = {

        checkpointId:
          checkpointHash,

        height:
          nextHeight,

        replays:
          Object.freeze([
            ...replays,
          ]),

        attestations:
          Object.freeze([
            ...attestations,
          ]),

        status:
          CheckpointStatus.FINALIZED,

        createdAt:
          Date.now(),
      };

      /**
       * Advance checkpoint height.
       */
      this.height =
        nextHeight;

      return {
        success: true,

        checkpoint,
      };

    } catch (
      error
    ) {

      return {
        success: false,

        reason:
          error instanceof Error
            ? error.message
            : "Checkpoint creation failed",
      };
    }
  }

  /* =====================================
   * ACCESSORS
   * ===================================*/

  /**
   * Current checkpoint height.
   */
  getHeight():
    number {

    return this.height;
  }

  /**
   * Reset checkpoint engine.
   */
  reset():
    void {

    this.height = 0;
  }
}