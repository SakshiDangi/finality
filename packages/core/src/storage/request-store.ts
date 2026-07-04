import type {
  Envelope,
} from "../base/envelope.js";

import type {
HashDigest,
} from "../base/primitives.js";


/* =========================================
 * REQUEST RECORD
 * =======================================*/

/**
 * Persisted protocol request.
 *
 * Represents canonical runtime
 * request storage entry.
 */
export interface RequestRecord {
  /**
   * Deterministic request digest.
   */
  digest:
    HashDigest;

  /**
   * Canonical protocol envelope.
   */
  envelope:
    Envelope;

  /**
   * Persistence timestamp.
   */
  createdAt:
    number;

  /**
   * Optional execution timestamp.
   */
  executedAt?:
    number;

  /**
   * Optional finalized timestamp.
   */
  finalizedAt?:
    number;
}

/* =========================================
 * REQUEST STORE
 * =======================================*/

/**
 * Deterministic request
 * persistence interface.
 *
 * Responsible for:
 *
 * - request persistence
 * - request retrieval
 * - execution tracking
 * - finalization tracking
 * - validator synchronization
 */
export interface RequestStore {
  /**
   * Persist request record.
   */
  set(
    record:
      RequestRecord,
  ): void;

  /**
   * Retrieve persisted request.
   */
  get(
    digest:
      HashDigest,
  ):
    | RequestRecord
    | undefined;

  /**
   * Detect persisted request.
   */
  has(
    digest:
      HashDigest,
  ): boolean;

  /**
   * Remove persisted request.
   */
  delete(
    digest:
      HashDigest,
  ): boolean;

  /**
   * Total persisted requests.
   */
  size():
    number;

  /**
   * Retrieve all requests.
   */
  values():
    readonly RequestRecord[];

  /**
   * Reset persistence layer.
   */
  clear():
    void;
}

/* =========================================
 * IN-MEMORY REQUEST STORE
 * =======================================*/

/**
 * Deterministic in-memory
 * request persistence layer.
 *
 * Intended for:
 *
 * - local development
 * - simulations
 * - testing
 * - protocol demos
 */
export class InMemoryRequestStore
  implements RequestStore {
  /**
   * Internal request storage.
   */
  private readonly store =
    new Map<
      HashDigest,
      RequestRecord
    >();

  /* =====================================
   * PERSISTENCE
   * ===================================*/

  set(
    record:
      RequestRecord,
  ): void {
    this.store.set(
      record.digest,
      record,
    );
  }

  get(
    digest:
      HashDigest,
  ):
    | RequestRecord
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

  /* =====================================
   * COLLECTION
   * ===================================*/

  size():
    number {
    return this.store.size;
  }

  values():
    readonly RequestRecord[] {
    return [
      ...this.store.values(),
    ];
  }

  clear():
    void {
    this.store.clear();
  }
}