import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  RequestRecord,
} from "../storage/request-store.js";

import type {
  ReplayRecord,
  NonceRecord,
} from "../storage/replay-store.js";

import type {
  SettlementRecord,
} from "../state/settlement.js";

import type {
  AttestationRecord,
} from "../storage/attestation-store.js";


/* =========================================
 * SNAPSHOT METADATA
 * =======================================*/

/**
 * Canonical snapshot metadata.
 *
 * Describes deterministic
 * snapshot identity.
 */
export interface SnapshotMetadata {
  /**
   * Snapshot identifier.
   */
  snapshotId:
    string;

  /**
   * Deterministic snapshot hash.
   */
  digest:
    HashDigest;

  /**
   * Origin validator/node.
   */
  node:
    string;

  /**
   * Snapshot creation timestamp.
   */
  createdAt:
    number;
}


/* =========================================
 * PROTOCOL SNAPSHOT
 * =======================================*/

/**
 * Canonical protocol state snapshot.
 *
 * Represents complete deterministic
 * protocol state at a specific time.
 */
export interface ProtocolSnapshot {
  /**
   * Snapshot metadata.
   */
  metadata:
    SnapshotMetadata;

  /**
   * Persisted requests.
   */
  requests:
    readonly RequestRecord[];

  /**
   * Replay protection state.
   */
  replays:
    readonly ReplayRecord[];

  /**
   * Sender nonce state.
   */
  nonces:
    readonly NonceRecord[];

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
}


/* =========================================
 * SNAPSHOT SUMMARY
 * =======================================*/

/**
 * Lightweight snapshot statistics.
 *
 * Used for:
 *
 * - synchronization checks
 * - reconciliation
 * - validator comparison
 * - network diagnostics
 */
export interface SnapshotSummary {
  requests:
    number;

  replays:
    number;

  nonces:
    number;

  settlements:
    number;

  attestations:
    number;
}


/* =========================================
 * SNAPSHOT RESULT
 * =======================================*/

/**
 * Snapshot creation result.
 */
export interface SnapshotResult {
  /**
   * Success state.
   */
  success:
    boolean;

  /**
   * Produced snapshot.
   */
  snapshot?:
    ProtocolSnapshot;

  /**
   * Failure diagnostics.
   */
  reason?:
    string;
}


/* =========================================
 * SNAPSHOT VALIDATION
 * =======================================*/

/**
 * Snapshot validation result.
 */
export interface SnapshotValidationResult {
  /**
   * Validation success state.
   */
  success:
    boolean;

  /**
   * Validation diagnostics.
   */
  reason?:
    string;
}


/* =========================================
 * SNAPSHOT UTILITIES
 * =======================================*/

/**
 * Calculate snapshot totals.
 */
export function createSnapshotSummary(
  snapshot:
    ProtocolSnapshot,
): SnapshotSummary {
  return {
    requests:
      snapshot.requests.length,

    replays:
      snapshot.replays.length,

    nonces:
      snapshot.nonces.length,

    settlements:
      snapshot.settlements.length,

    attestations:
      snapshot.attestations.length,
  };
}