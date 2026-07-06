import type {
  ProtocolAddress,
  HashDigest,
} from "../base/primitives.js";

import {
  ProtocolState,
} from "../state/transitions.js";

/* =========================================
 * REPLAY RECORD
 * =======================================*/

/**
 * Persisted replay-protection entry.
 * Represents canonical replay
 * execution history.
 *
 * Used for:
 * - duplicate detection
 * - nonce ordering
 * - validator synchronization
 * - stale packet analysis
 * - distributed recovery
 */
export interface ReplayRecord {
  digest: HashDigest;

  sender: ProtocolAddress;

  nonce: number;

  /**
   * Current protocol lifecycle.
   */
  state: ProtocolState;

  /**
   * Initial persistence timestamp.
   */
  createdAt: number;

  /**
   * Last lifecycle update.
   */
  updatedAt: number;
}

/* =========================================
 * NONCE RECORD
 * =======================================*/

/**
 * Persisted sender nonce state.
 *
 * Tracks latest accepted nonce
 * for deterministic ordering.
 */
export interface NonceRecord {
  sender:
    ProtocolAddress;

  nonce:
    number;

  updatedAt:
    number;
}

/* =========================================
 * REPLAY STORE
 * =======================================*/

/**
 * Deterministic replay
 * persistence interface.
 *
 * Responsible for:
 *
 * - replay protection
 * - request digest tracking
 * - sender nonce management
 * - lifecycle updates
 * - validator synchronization
 * - distributed consistency
 */
export interface ReplayStore {
  /* =====================================
   * REPLAY OPERATIONS
   * ===================================*/
  
    /**
   * Persist replay digest.
   */
  trackReplay(
    digest:
      HashDigest,
  ):
    | Promise<void>
    | void;
  
  /**
   * Persist sender nonce.
   */
  trackNonce(
  
    sender:
      string,
  
    nonce:
      number,
  ):
    | Promise<void>
    | void;

  /**
   * Persist replay record.
   */
  setReplay(
    record:
      ReplayRecord,
  ): void;

  /**
   * Update mutable replay
   * lifecycle information.
   *
   * Immutable fields:
   *
   * - digest
   * - sender
   * - nonce
   * - createdAt
   */
  updateReplay(
    digest:
      HashDigest,

    patch:
      Pick<
        ReplayRecord,
        | "state"
        | "updatedAt"
      >,
  ): boolean;

  /**
   * Retrieve replay record.
   */
  getReplay(
    digest:
      HashDigest,
  ):
    | ReplayRecord
    | undefined;

  /**
   * Detect replay record.
   */
  hasReplay(
    digest:
      HashDigest,
  ): boolean;

  /**
   * Remove replay record.
   */
  deleteReplay(
    digest:
      HashDigest,
  ): boolean;

  /* =====================================
   * NONCE OPERATIONS
   * ===================================*/

  /**
   * Persist sender nonce.
   */
  setNonce(
    record:
      NonceRecord,
  ): void;

  /**
   * Update sender nonce.
   */
  updateNonce(
    sender: ProtocolAddress,
    nonce: number,
    updatedAt: number,
  ): void;

  /**
   * Retrieve sender nonce.
   */
  getNonce(
    sender:
      ProtocolAddress,
  ):
    | NonceRecord
    | undefined;

  /**
   * Retrieve latest accepted nonce.
   */
  getLatestNonce(
    sender:
      ProtocolAddress,
  ):
    | number
    | undefined;

  /**
   * Detect sender nonce.
   */
  hasNonce(
    sender:
      ProtocolAddress,
  ): boolean;

  /**
   * Remove sender nonce.
   */
  deleteNonce(
    sender:
      ProtocolAddress,
  ): boolean;

  /* =====================================
   * COLLECTION OPERATIONS
   * ===================================*/

  /**
   * Total replay records.
   */
  replaySize():
    number;

  /**
   * Total nonce records.
   */
  nonceSize():
    number;

  /**
   * Replay record keys.
   */
  replayKeys():
    readonly HashDigest[];

  /**
   * Nonce record keys.
   */
  nonceKeys():
    readonly ProtocolAddress[];

  /**
   * Replay records.
   */
  replayValues():
    readonly ReplayRecord[];

  /**
   * Nonce records.
   */
  nonceValues():
    readonly NonceRecord[];

  /**
   * Replay key-value pairs.
   */
  replayEntries():
    readonly (
      readonly [
        HashDigest,
        ReplayRecord,
      ]
    )[];

  /**
   * Nonce key-value pairs.
   */
  nonceEntries():
    readonly (
      readonly [
        ProtocolAddress,
        NonceRecord,
      ]
    )[];

  /**
   * Reset replay persistence.
   */
  clear():
    void;
}

/* =========================================
 * IN-MEMORY REPLAY STORE
 * =======================================*/

/**
 * Deterministic in-memory
 * replay persistence layer.
 *
 * Intended for:
 *
 * - protocol simulations
 * - integration testing
 * - local validator runtimes
 * - attack demonstrations
 */
export class InMemoryReplayStore
  implements ReplayStore {
  /**
   * Replay persistence storage.
   *
   * Key:
   *   request digest
   */
  private readonly replays =
    new Map<
      HashDigest,
      ReplayRecord
    >();

  /**
   * Sender nonce persistence.
   *
   * Key:
   *   protocol address
   */
  private readonly nonces =
    new Map<
      ProtocolAddress,
      NonceRecord
    >();

  /* =====================================
   * REPLAY OPERATIONS
   * ===================================*/

  /**
   * Persist replay record.
   */
  setReplay(
    record:
      ReplayRecord,
  ): void {
    this.replays.set(
      record.digest,
      Object.freeze({
        ...record,
      }),
    );
  }

  /**
   * Update existing replay record.
   *
   * Returns false when the
   * replay record does not exist.
   */
  updateReplay(
    digest:
      HashDigest,

    patch:
      Partial<ReplayRecord>,
  ): boolean {

    const current =
      this.replays.get(
        digest,
      );

    if (!current) {
      return false;
    }

    this.replays.set(
      digest,
      Object.freeze({
        ...current,
        ...patch,
      }),
    );

    return true;
  }

  /**
   * Retrieve replay record.
   */
  getReplay(
    digest:
      HashDigest,
  ):
    | ReplayRecord
    | undefined {

    return this.replays.get(
      digest,
    );
  }

  /**
   * Detect replay record.
   */
  hasReplay(
    digest:
      HashDigest,
  ): boolean {

    return this.replays.has(
      digest,
    );
  }

  /* =====================================
 * TRACK REPLAY
 * ===================================*/

  trackReplay(
    digest: HashDigest,
  ): void {
  
    if (this.replays.has(digest)) {
      return;
    }
  
    this.replays.set(
      digest,
      Object.freeze({
  
        digest,
  
        sender:
          "0x0000000000000000000000000000000000000000",
  
        nonce: 0,
  
        state:
          ProtocolState.RECEIVED,
  
        createdAt:
          Date.now(),
  
        updatedAt:
          Date.now(),
      }),
    );
  }
  
  /* =====================================
   * TRACK NONCE
   * ===================================*/
  
  trackNonce(
  
    sender: string,
  
    nonce: number,
  ): void {
  
    this.nonces.set(
      sender as ProtocolAddress,
  
      Object.freeze({
  
        sender:
          sender as ProtocolAddress,
  
        nonce,
  
        updatedAt:
          Date.now(),
      }),
    );
  }

  /**
   * Remove replay record.
   */
  deleteReplay(
    digest:
      HashDigest,
  ): boolean {

    return this.replays.delete(
      digest,
    );
  }

  /* =====================================
   * NONCE OPERATIONS
   * ===================================*/

  /**
   * Persist nonce record.
   */
  setNonce(
    record:
      NonceRecord,
  ): void {

    this.nonces.set(
      record.sender,
      Object.freeze({
        ...record,
      }),
    );
  }

  /**
   * Update sender nonce.
   */
  updateNonce(
    sender:
      ProtocolAddress,

    nonce:
      number,

    updatedAt:
      number,
  ): void {

    this.nonces.set(
      sender,
      Object.freeze({
        sender,
        nonce,
        updatedAt,
      }),
    );
  }

  /**
   * Retrieve nonce record.
   */
  getNonce(
    sender:
      ProtocolAddress,
  ):
    | NonceRecord
    | undefined {

    return this.nonces.get(
      sender,
    );
  }

  /**
   * Retrieve latest sender nonce.
   */
  getLatestNonce(
    sender:
      ProtocolAddress,
  ):
    | number
    | undefined {

    return this.nonces.get(
      sender,
    )?.nonce;
  }

  /**
   * Detect nonce record.
   */
  hasNonce(
    sender:
      ProtocolAddress,
  ): boolean {

    return this.nonces.has(
      sender,
    );
  }

  /**
   * Remove nonce record.
   */
  deleteNonce(
    sender:
      ProtocolAddress,
  ): boolean {

    return this.nonces.delete(
      sender,
    );
  }

  /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total replay records.
   */
  replaySize():
    number {

    return this.replays.size;
  }

  /**
   * Total nonce records.
   */
  nonceSize():
    number {

    return this.nonces.size;
  }

  /**
   * Replay values.
   */
  replayValues():
    readonly ReplayRecord[] {

    return [
      ...this.replays.values(),
    ];
  }

  /**
   * Nonce values.
   */
  nonceValues():
    readonly NonceRecord[] {

    return [
      ...this.nonces.values(),
    ];
  }

  /**
   * Replay entries.
   */
  replayEntries():
    readonly (
      readonly [
        HashDigest,
        ReplayRecord,
      ]
    )[] {

    return [
      ...this.replays.entries(),
    ];
  }

  /**
   * Nonce entries.
   */
  nonceEntries():
    readonly (
      readonly [
        ProtocolAddress,
        NonceRecord,
      ]
    )[] {

    return [
      ...this.nonces.entries(),
    ];
  }

  /**
   * Replay keys.
   */
  replayKeys():
    readonly HashDigest[] {

    return [
      ...this.replays.keys(),
    ];
  }

  /**
   * Nonce keys.
   */
  nonceKeys():
    readonly ProtocolAddress[] {

    return [
      ...this.nonces.keys(),
    ];
  }

  /**
   * Reset replay store.
   */
  clear():
    void {

    this.replays.clear();

    this.nonces.clear();
  }
}