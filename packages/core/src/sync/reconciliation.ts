import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  RequestRecord,
  RequestStore,
} from "../storage/request-store.js";

import type {
  ReplayRecord,
  ReplayStore,
} from "../storage/replay-store.js";

import type {
  SettlementRecord,
} from "../state/settlement.js";

import type {
  SettlementEngine,
} from "../state/settlement.js";

import type {
  AttestationRecord,
  AttestationStore,
} from "../storage/attestation-store.js";

/* =========================================
 * RECONCILIATION STATUS
 * =======================================*/

/**
 * Deterministic reconciliation outcome.
 */
export enum ReconciliationStatus {
  /**
   * Local and remote state match.
   */
  CONSISTENT =
    "CONSISTENT",

  /**
   * Missing local records detected.
   */
  MISSING_LOCAL =
    "MISSING_LOCAL",

  /**
   * Missing remote records detected.
   */
  MISSING_REMOTE =
    "MISSING_REMOTE",

  /**
   * State conflict detected.
   */
  CONFLICT =
    "CONFLICT",
}

/* =========================================
 * RECONCILIATION CONFLICT
 * =======================================*/

/**
 * Canonical synchronization conflict.
 */
export interface ReconciliationConflict {
  /**
   * Deterministic request digest.
   */
  digest:
    HashDigest;

  /**
   * Conflict type.
   */
  status:
    ReconciliationStatus;

  /**
   * Human-readable diagnostics.
   */
  reason:
    string;
}

/* =========================================
 * RECONCILIATION SNAPSHOT
 * =======================================*/

/**
 * Immutable synchronization snapshot.
 *
 * Represents validator state
 * at reconciliation time.
 */
export interface ReconciliationSnapshot {
  /**
   * Persisted requests.
   */
  requests:
    readonly RequestRecord[];

  /**
   * Replay records.
   */
  replays:
    readonly ReplayRecord[];

  /**
   * Settlement records.
   */
  settlements:
    readonly SettlementRecord[];

  /**
   * Validator attestations.
   */
  attestations:
    readonly AttestationRecord[];

  /**
   * Snapshot timestamp.
   */
  createdAt:
    number;
}

/* =========================================
 * RECONCILIATION RESULT
 * =======================================*/

/**
 * Deterministic reconciliation result.
 */
export interface ReconciliationResult {
  /**
   * Reconciliation success state.
   */
  success:
    boolean;

  /**
   * Total compared digests.
   */
  compared:
    number;

  /**
   * Detected conflicts.
   */
  conflicts:
    readonly ReconciliationConflict[];

  /**
   * Reconciliation timestamp.
   */
  reconciledAt:
    number;
}

/* =========================================
 * RECONCILIATION CONTEXT
 * =======================================*/

/**
 * Synchronization runtime dependencies.
 */
export interface ReconciliationContext {
  /**
   * Request persistence.
   */
  requestStore:
    RequestStore;

  /**
   * Replay persistence.
   */
  replayStore:
    ReplayStore;

  /**
   * Settlement persistence.
   */
  settlementStore:
    SettlementEngine;

  /**
   * Attestation persistence.
   */
  attestationStore:
    AttestationStore;
}

/* =========================================
 * SNAPSHOT CREATION
 * =======================================*/

/**
 * Creates immutable
 * reconciliation snapshot.
 */
export function createSnapshot(
  context:
    ReconciliationContext,
): ReconciliationSnapshot {

  return {
    requests:
      context.requestStore.values(),

    replays:
      context.replayStore.replayValues(),

    settlements:
      context.settlementStore.values(),

    attestations:
      context.attestationStore.values(),

    createdAt:
      Date.now(),
  };
}

/* =========================================
 * RECONCILIATION
 * =======================================*/

/**
 * Reconciles distributed
 * protocol state.
 *
 * Flow:
 *
 * local snapshot
 * -> remote snapshot
 * -> compare digests
 * -> detect conflicts
 * -> return reconciliation result
 */
export function reconcileSnapshots(

  local:
    ReconciliationSnapshot,

  remote:
    ReconciliationSnapshot,

): ReconciliationResult {

  const conflicts:
    ReconciliationConflict[] = [];

  /**
   * Local request digests.
   */
  const localDigests =
    new Set<HashDigest>(
      local.requests.map(
        (
          request,
        ) =>
          request.digest,
      ),
    );

  /**
   * Remote request digests.
   */
  const remoteDigests =
    new Set<HashDigest>(
      remote.requests.map(
        (
          request,
        ) =>
          request.digest,
      ),
    );

  /* =====================================
   * LOCAL CONSISTENCY
   * ===================================*/

  for (
    const digest
    of localDigests
  ) {
    if (
      !remoteDigests.has(
        digest,
      )
    ) {
      conflicts.push({
        digest,

        status:
          ReconciliationStatus.MISSING_REMOTE,

        reason:
          "Digest missing from remote validator",
      });
    }
  }

  /* =====================================
   * REMOTE CONSISTENCY
   * ===================================*/

  for (
    const digest
    of remoteDigests
  ) {
    if (
      !localDigests.has(
        digest,
      )
    ) {
      conflicts.push({
        digest,

        status:
          ReconciliationStatus.MISSING_LOCAL,

        reason:
          "Digest missing from local validator",
      });
    }
  }

  /* =====================================
   * RESULT
   * ===================================*/

  return {
    success:
      conflicts.length === 0,

    compared:
      Math.max(
        localDigests.size,
        remoteDigests.size,
      ),

    conflicts,

    reconciledAt:
      Date.now(),
  };
}