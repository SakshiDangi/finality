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
 * SYNC MESSAGE TYPES
 * =======================================*/

/**
 * Canonical synchronization packet types.
 *
 * Defines all distributed
 * protocol synchronization flows.
 */
export enum SyncMessageType {
  /**
   * Request synchronization.
   */
  REQUEST =
    "REQUEST",

  /**
   * Replay-state synchronization.
   */
  REPLAY =
    "REPLAY",

  /**
   * Nonce synchronization.
   */
  NONCE =
    "NONCE",

  /**
   * Settlement synchronization.
   */
  SETTLEMENT =
    "SETTLEMENT",

  /**
   * Validator attestation synchronization.
   */
  ATTESTATION =
    "ATTESTATION",

  /**
   * Full-state snapshot synchronization.
   */
  SNAPSHOT =
    "SNAPSHOT",

  /**
   * State reconciliation synchronization.
   */
  RECONCILIATION =
    "RECONCILIATION",
}


/* =========================================
 * SYNC MESSAGE
 * =======================================*/

/**
 * Canonical distributed
 * synchronization packet.
 *
 * Used between:
 *
 * - validators
 * - protocol nodes
 * - synchronization engines
 * - reconciliation pipelines
 */
export interface SyncMessage<T> {
  /**
   * Synchronization message type.
   */
  type:
    SyncMessageType;

  /**
   * Deterministic message digest.
   */
  digest:
    HashDigest;

  /**
   * Canonical payload.
   */
  payload:
    T;

  /**
   * Origin node identifier.
   */
  node:
    string;

  /**
   * Deterministic creation timestamp.
   */
  timestamp:
    number;
}


/* =========================================
 * SPECIALIZED SYNC MESSAGES
 * =======================================*/

export type RequestSyncMessage =
  SyncMessage<RequestRecord>;

export type ReplaySyncMessage =
  SyncMessage<ReplayRecord>;

export type NonceSyncMessage =
  SyncMessage<NonceRecord>;

export type SettlementSyncMessage =
  SyncMessage<SettlementRecord>;

export type AttestationSyncMessage =
  SyncMessage<AttestationRecord>;


/* =========================================
 * SYNC BATCH
 * =======================================*/

/**
 * Canonical synchronization batch.
 *
 * Allows deterministic
 * multi-message synchronization.
 */
export interface SyncBatch {
  /**
   * Batch identifier.
   */
  batchId:
    string;

  /**
   * Synchronization messages.
   */
  messages:
    readonly SyncMessage<unknown>[];

  /**
   * Batch creation timestamp.
   */
  createdAt:
    number;
}


/* =========================================
 * SNAPSHOT SYNC MESSAGE
 * =======================================*/

export interface SnapshotPayload {
  requests:
    readonly RequestRecord[];

  replays:
    readonly ReplayRecord[];

  nonces:
    readonly NonceRecord[];

  settlements:
    readonly SettlementRecord[];

  attestations:
    readonly AttestationRecord[];
}

export type SnapshotSyncMessage =
  SyncMessage<SnapshotPayload>;


/* =========================================
 * RECONCILIATION MESSAGE
 * =======================================*/

export interface ReconciliationPayload {
  /**
   * Missing request digests.
   */
  missing:
    readonly HashDigest[];

  /**
   * Conflicting request digests.
   */
  conflicts:
    readonly HashDigest[];
}

export type ReconciliationSyncMessage =
  SyncMessage<
    ReconciliationPayload
  >;
