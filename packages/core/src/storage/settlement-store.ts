import type {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  ProtocolState,
} from "../state/transitions.js";

import type {
  SettlementStatus,
} from "../state/settlement.js";

/* =========================================
 * SETTLEMENT RECORD
 * =======================================*/

/**
 * Immutable persisted
 * settlement record.
 */
export interface SettlementRecord {

  /**
   * Request digest.
   */
  digest:
    HashDigest;

  /**
   * Original envelope.
   */
  envelope?:
    Envelope;

  /**
   * Final lifecycle state.
   */
  state:
    ProtocolState;

  /**
   * Settlement status.
   */
  status:
    SettlementStatus;

  /**
   * Execution result payload.
   */
  result?:
    unknown;

  /**
   * Settlement timestamp.
   */
  settledAt:
    number;
}

/* =========================================
 * SETTLEMENT STORE
 * =======================================*/

/**
 * Persistence abstraction
 * for settlement storage.
 */
export interface SettlementStore {

  /**
   * Persist settlement record.
   */
  set(
    record:
      SettlementRecord,
  ):
    | Promise<void>
    | void;

  /**
   * Retrieve settlement.
   */
  get(
    digest:
      HashDigest,
  ):
    | Promise<
        SettlementRecord
        | undefined
      >
    | SettlementRecord
    | undefined;

  /**
   * Detect settlement existence.
   */
  has(
    digest:
      HashDigest,
  ):
    | Promise<boolean>
    | boolean;

  /**
   * Remove settlement.
   */
  delete(
    digest:
      HashDigest,
  ):
    | Promise<boolean>
    | boolean;

  /**
   * Clear settlement store.
   */
  clear():
    | Promise<void>
    | void;
}

/* =========================================
 * IN-MEMORY STORE
 * =======================================*/

/**
 * Default deterministic
 * in-memory settlement store.
 */
export class MemorySettlementStore
  implements SettlementStore {

  private readonly store =
    new Map<
      HashDigest,
      SettlementRecord
    >();

  set(
    record:
      SettlementRecord,
  ): void {

    this.store.set(
      record.digest,
      Object.freeze({
        ...record,
      }),
    );
  }

  get(
    digest:
      HashDigest,
  ):
    | SettlementRecord
    | undefined {

    return this.store.get(
      digest,
    );
  }

  has(
    digest:
      HashDigest,
  ): boolean {

    return this.store.has(
      digest,
    );
  }

  delete(
    digest:
      HashDigest,
  ): boolean {

    return this.store.delete(
      digest,
    );
  }

  clear():
    void {

    this.store.clear();
  }
}