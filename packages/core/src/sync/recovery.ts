import type {
  ReplayRecord,
  ReplayStore,
} from "../storage/replay-store.js";

import type {
  AttestationRecord,
  AttestationStore,
} from "../storage/attestation-store.js";

import type {
  CheckpointSnapshot,
} from "./checkpoint.js";

/* =========================================
 * RECOVERY STATUS
 * =======================================*/

/**
 * Canonical recovery lifecycle.
 */
export enum RecoveryStatus {
  /**
   * Recovery completed.
   */
  RECOVERED =
    "RECOVERED",

  /**
   * Recovery failed.
   */
  FAILED =
    "FAILED",
}

/* =========================================
 * RECOVERY RESULT
 * =======================================*/

/**
 * Distributed recovery result.
 */
export interface RecoveryResult {
  /**
   * Recovery success state.
   */
  success:
    boolean;

  /**
   * Recovery lifecycle.
   */
  status:
    RecoveryStatus;

  /**
   * Total replay records restored.
   */
  restoredReplays:
    number;

  /**
   * Total attestations restored.
   */
  restoredAttestations:
    number;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * RECOVERY CONTEXT
 * =======================================*/

/**
 * Recovery runtime dependencies.
 */
export interface RecoveryContext {
  /**
   * Replay persistence layer.
   */
  replayStore:
    ReplayStore;

  /**
   * Attestation persistence layer.
   */
  attestationStore:
    AttestationStore;
}

/* =========================================
 * RECOVERY ENGINE
 * =======================================*/

/**
 * Deterministic distributed
 * recovery engine.
 *
 * Responsible for:
 *
 * - checkpoint restoration
 * - replay synchronization
 * - attestation recovery
 * - distributed repair
 */
export class RecoveryEngine {
  /**
   * Runtime dependencies.
   */
  private readonly context:
    RecoveryContext;

  constructor(
    context:
      RecoveryContext,
  ) {
    this.context =
      Object.freeze({
        ...context,
      });
  }

  /* =====================================
   * CHECKPOINT RECOVERY
   * ===================================*/

  /**
   * Restores distributed state
   * from checkpoint snapshot.
   */
  recover(
    checkpoint:
      CheckpointSnapshot,
  ): RecoveryResult {

    try {

      /* ===================================
       * RESTORE REPLAY RECORDS
       * =================================*/

      for (
        const replay
        of checkpoint.replays
      ) {

        this.context
          .replayStore
          .setReplay(
            replay,
          );

        this.context
          .replayStore
          .setNonce({
            sender:
              replay.sender,

            nonce:
              replay.nonce,

            updatedAt:
              replay.updatedAt,
          });
      }

      /* ===================================
       * RESTORE ATTESTATIONS
       * =================================*/

      for (
        const attestation
        of checkpoint.attestations
      ) {

        this.context
          .attestationStore
          .set(
            attestation,
          );
      }

      /* ===================================
       * SUCCESS
       * =================================*/

      return {
        success: true,

        status:
          RecoveryStatus.RECOVERED,

        restoredReplays:
          checkpoint.replays.length,

        restoredAttestations:
          checkpoint.attestations.length,
      };

    } catch (
      error
    ) {

      return {
        success: false,

        status:
          RecoveryStatus.FAILED,

        restoredReplays: 0,

        restoredAttestations: 0,

        reason:
          error instanceof Error
            ? error.message
            : "Recovery failed",
      };
    }
  }

  /* =====================================
   * RESET STORES
   * ===================================*/

  /**
   * Clears distributed state.
   */
  reset():
    void {

      this.context
        .replayStore
        .clear();

      this.context
        .attestationStore
        .clear();
  }
}