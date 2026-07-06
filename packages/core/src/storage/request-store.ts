import type {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import {
  ProtocolState,
} from "../state/transitions.js";

import type {
  ExecutionResult,
} from "../execution/result.js";

import type {
  SettlementReceipt,
} from "../execution/request-settlement.js";

import type {
  AttestationReceipt,
} from "../execution/request-attestation.js";


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
   * Request digest.
   */
  digest:
    HashDigest;

  /**
   * Canonical envelope.
   */
  envelope:
    Envelope;

  /**
   * Current protocol state.
   */
  state:
    ProtocolState;

  /**
   * Execution snapshot.
   */
  execution?:
    ExecutionResult;

  /**
   * Settlement receipt.
   */
  settlement?:
    SettlementReceipt;

  /**
   * Attestation receipt.
   */
  attestation?:
    AttestationReceipt;

  /**
   * Creation timestamp.
   */
  createdAt:
    number;

  /**
   * Last lifecycle update.
   */
  updatedAt?:
  number;

  /**
   * Execution timestamp.
   */
  executedAt?:
    number;

  /**
   * Settlement timestamp.
   */
  settledAt?:
    number;

  /**
   * Finalization timestamp.
   */
  finalizedAt?:
    number;

    /**
   * Arbitrary metadata.
   */
  metadata?:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
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
 * - lifecycle tracking
 * - execution snapshots
 * - settlement tracking
 * - attestation tracking
 * - validator synchronization
 */
export interface RequestStore {

  /* =====================================
   * REQUEST OPERATIONS
   * ===================================*/

  /**
   * Persist request record.
   */
  set(
    record:
      RequestRecord,
  ): void;

  /**
   * Update existing request.
   *
   * Returns false if the
   * request does not exist.
   */
  update(
    digest:
      HashDigest,

    patch:
      Partial<RequestRecord>,
  ): boolean;

  /**
   * Retrieve request.
   */
  get(
    digest:
      HashDigest,
  ):
    | RequestRecord
    | undefined;

  /**
   * Detect request.
   */
  has(
    digest:
      HashDigest,
  ): boolean;

  /**
   * Remove request.
   */
  delete(
    digest:
      HashDigest,
  ): boolean;

  /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total stored requests.
   */
  size():
    number;

  /**
   * Retrieve all requests.
   */
  values():
    readonly RequestRecord[];

  /**
   * Retrieve request entries.
   */
  entries():
    readonly (
      readonly [
        HashDigest,
        RequestRecord,
      ]
    )[];

  /**
   * Retrieve request digests.
   */
  keys():
    readonly HashDigest[];

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
 * - protocol simulations
 * - integration testing
 * - validator runtimes
 */
export class InMemoryRequestStore
  implements RequestStore {

  /**
   * Internal request storage.
   *
   * Key:
   *   request digest
   */
  private readonly requests =
    new Map<
      HashDigest,
      RequestRecord
    >();

  /* =====================================
   * REQUEST OPERATIONS
   * ===================================*/

  /**
   * Persist request record.
   */
  set(
    record:
      RequestRecord,
  ): void {

    this.requests.set(
      record.digest,
      Object.freeze({
        ...record,
      }),
    );
  }

  /**
   * Update existing request.
   *
   * Returns false when the
   * request does not exist.
   */
  update(
    digest:
      HashDigest,

    patch:
      Partial<RequestRecord>,
  ): boolean {

    const current =
      this.requests.get(
        digest,
      );

    if (!current) {
      return false;
    }

    this.requests.set(
      digest,
      Object.freeze({
        ...current,
        ...patch,
      }),
    );

    return true;
  }

  /**
   * Retrieve request.
   */
  get(
    digest:
      HashDigest,
  ):
    | RequestRecord
    | undefined {

    return this.requests.get(
      digest,
    );
  }

  /**
   * Detect request.
   */
  has(
    digest:
      HashDigest,
  ): boolean {

    return this.requests.has(
      digest,
    );
  }

  /**
   * Remove request.
   */
  delete(
    digest:
      HashDigest,
  ): boolean {

    return this.requests.delete(
      digest,
    );
  }

  /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total stored requests.
   */
  size():
    number {

    return this.requests.size;
  }

  /**
   * Retrieve request records.
   */
  values():
    readonly RequestRecord[] {

    return [
      ...this.requests.values(),
    ];
  }

  /**
   * Retrieve request entries.
   */
  entries():
    readonly (
      readonly [
        HashDigest,
        RequestRecord,
      ]
    )[] {

    return [
      ...this.requests.entries(),
    ];
  }

  /**
   * Retrieve request digests.
   */
  keys():
    readonly HashDigest[] {

    return [
      ...this.requests.keys(),
    ];
  }

  /**
   * Reset persistence layer.
   */
  clear():
    void {

    this.requests.clear();
  }
}