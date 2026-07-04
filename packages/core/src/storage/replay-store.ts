import type {
ProtocolAddress,
HashDigest,
} from "../base/primitives.js";


/* =========================================
 * REPLAY RECORD
 * =======================================*/

/**
 * Persisted replay-protection entry.
 *
 * Represents canonical replay
 * execution history.
 *
 * Used for:
 *
 * - duplicate detection
 * - nonce ordering
 * - validator synchronization
 * - stale packet analysis
 * - distributed recovery
 */
export interface ReplayRecord {
  /**
   * Deterministic request digest.
   */
  digest:
    HashDigest;

  /**
   * Canonical sender identity.
   */
  sender:
    ProtocolAddress;

  /**
   * Sender nonce.
   */
  nonce:
    number;

  /**
   * Initial persistence timestamp.
   */
  createdAt:
    number;

  /**
   * Optional execution timestamp.
   */
  executedAt?:
    number;

  /**
   * Optional finalization timestamp.
   */
  finalizedAt?:
    number;
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
  /**
   * Sender identity.
   */
  sender:
    ProtocolAddress;

  /**
   * Latest accepted nonce.
   */
  nonce:
    number;

  /**
   * Last update timestamp.
   */
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
 * - replay persistence
 * - nonce tracking
 * - replay lookups
 * - validator synchronization
 * - distributed consistency
 */
export interface ReplayStore {
  /* =====================================
   * DIGEST OPERATIONS
   * ===================================*/

  /**
   * Persist replay record.
   */
  setReplay(
    record:
      ReplayRecord,
  ): void;

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
   * Detect replay digest.
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
   * Persist sender nonce state.
   */
  setNonce(
    record:
      NonceRecord,
  ): void;

  /**
   * Retrieve sender nonce state.
   */
  getNonce(
    sender:
      ProtocolAddress,
  ):
    | NonceRecord
    | undefined;

  /**
   * Detect nonce state.
   */
  hasNonce(
    sender:
      ProtocolAddress,
  ): boolean;

  /**
   * Remove nonce state.
   */
  deleteNonce(
    sender:
      ProtocolAddress,
  ): boolean;

  /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total replay entries.
   */
  replaySize():
    number;

  /**
   * Total nonce entries.
   */
  nonceSize():
    number;

  /**
   * Retrieve all replay entries.
   */
  replayValues():
    readonly ReplayRecord[];

  /**
   * Retrieve all nonce entries.
   */
  nonceValues():
    readonly NonceRecord[];

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
   */
  private readonly replays =
    new Map<
      HashDigest,
      ReplayRecord
    >();

  /**
   * Sender nonce persistence.
   */
  private readonly nonces =
    new Map<
      ProtocolAddress,
      NonceRecord
    >();

  /* =====================================
   * REPLAY OPERATIONS
   * ===================================*/

  setReplay(
    record:
      ReplayRecord,
  ): void {
    this.replays.set(
      record.digest,
      record,
    );
  }

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

  hasReplay(
    digest:
      HashDigest,
  ): boolean {
    return this.replays.has(
      digest,
    );
  }

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

  setNonce(
    record:
      NonceRecord,
  ): void {
    this.nonces.set(
      record.sender,
      record,
    );
  }

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

  hasNonce(
    sender:
      ProtocolAddress,
  ): boolean {
    return this.nonces.has(
      sender,
    );
  }

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

  replaySize():
    number {
    return this.replays.size;
  }

  nonceSize():
    number {
    return this.nonces.size;
  }

  replayValues():
    readonly ReplayRecord[] {
    return [
      ...this.replays.values(),
    ];
  }

  nonceValues():
    readonly NonceRecord[] {
    return [
      ...this.nonces.values(),
    ];
  }

  clear():
    void {
    this.replays.clear();

    this.nonces.clear();
  }
}