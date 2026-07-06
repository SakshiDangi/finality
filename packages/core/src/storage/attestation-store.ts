import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  AttestationReceipt,
} from "../execution/request-attestation.js";


/* =========================================
 * ATTESTATION RECORD
 * =======================================*/

/**
 * Persisted validator attestation.
 *
 * Represents immutable validator
 * approval persistence.
 *
 * Used for:
 *
 * - validator synchronization
 * - quorum aggregation
 * - distributed consensus
 * - finalization
 * - auditability
 */
export interface AttestationRecord {
  /**
   * Settlement digest.
   */
  digest:
    HashDigest;

  /**
   * Immutable attestation receipt.
   */
  attestation:
    AttestationReceipt;

  /**
   * Persistence timestamp.
   */
  createdAt:
    number;
}


/* =========================================
 * ATTESTATION STORE
 * =======================================*/

/**
 * Deterministic attestation
 * persistence interface.
 *
 * Responsible for:
 *
 * - validator attestation persistence
 * - quorum aggregation support
 * - distributed synchronization
 * - validator lookup
 * - finalization support
 */
export interface AttestationStore {
  /* =====================================
   * PERSISTENCE
   * ===================================*/

  /**
   * Persist attestation record.
   */
  set(
    record:
      AttestationRecord,
  ): void;

  /**
   * Update attestation record.
   */
  update(
    digest:
      HashDigest,

    patch:
      Partial<AttestationRecord>,
  ): boolean;

  /* =====================================
   * LOOKUP
   * ===================================*/

  /**
   * Retrieve attestation record.
   */
  get(
    digest:
      HashDigest,
  ):
    | AttestationRecord
    | undefined;

  /**
   * Detect persisted attestation.
   */
  has(
    digest:
      HashDigest,
  ): boolean;

  /**
   * Remove attestation record.
   */
  delete(
    digest:
      HashDigest,
  ): boolean;

  /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total persisted attestations.
   */
  size():
    number;

  /**
   * Retrieve all attestations.
   */
  values():
    readonly AttestationRecord[];

  /**
   * Retrieve all entries.
   */
  entries():
    readonly (
      readonly [
        HashDigest,
        AttestationRecord,
      ]
    )[];

  /**
   * Retrieve all digests.
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
 * IN-MEMORY ATTESTATION STORE
 * =======================================*/

/**
 * Deterministic in-memory
 * attestation persistence layer.
 *
 * Intended for:
 *
 * - simulations
 * - testing
 * - local validators
 * - protocol demos
 */
export class InMemoryAttestationStore
  implements AttestationStore {

  /**
   * Internal persistence storage.
   */
  private readonly store =
    new Map<
      HashDigest,
      AttestationRecord
    >();

  /* =====================================
   * PERSISTENCE
   * ===================================*/

  set(
    record:
      AttestationRecord,
  ): void {

    this.store.set(
      record.digest,

      Object.freeze({
        ...record,
      }),
    );
  }

  update(
    digest:
      HashDigest,

    patch:
      Partial<AttestationRecord>,
  ): boolean {

    const current =
      this.store.get(
        digest,
      );

    if (!current) {
      return false;
    }

    this.store.set(
      digest,

      Object.freeze({
        ...current,
        ...patch,
      }),
    );

    return true;
  }

  /* =====================================
   * LOOKUP
   * ===================================*/

  get(
    digest:
      HashDigest,
  ):
    | AttestationRecord
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
    readonly AttestationRecord[] {

    return [
      ...this.store.values(),
    ];
  }

  entries():
    readonly (
      readonly [
        HashDigest,
        AttestationRecord,
      ]
    )[] {

    return [
      ...this.store.entries(),
    ];
  }

  keys():
    readonly HashDigest[] {

    return [
      ...this.store.keys(),
    ];
  }

  clear():
    void {

    this.store.clear();
  }
}