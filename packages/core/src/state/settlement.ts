import {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import {
  ProtocolState,
} from "./transitions.js";

/* =========================================
 * SETTLEMENT STATUS
 * =======================================*/

/**
 * Deterministic settlement outcome.
 *
 * Represents immutable execution result.
 */
export enum SettlementStatus {
  /**
   * Execution completed successfully.
   */
  SUCCESS =
    "SUCCESS",

  /**
   * Execution failed.
   */
  FAILURE =
    "FAILURE",
}

/* =========================================
 * SETTLEMENT RECORD
 * =======================================*/

/**
 * Immutable protocol settlement record.
 *
 * Represents finalized execution output.
 *
 * Used for:
 *
 * - execution receipts
 * - validator agreement
 * - auditability
 * - replay-safe persistence
 * - distributed synchronization
 */
export interface SettlementRecord {
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
   * Final execution lifecycle state.
   */
  state:
    ProtocolState;

  /**
   * Immutable settlement status.
   */
  status:
    SettlementStatus;

  /**
   * Optional settlement result.
   */
  result?:
    unknown;

  /**
   * Failure diagnostics.
   */
  error?:
    string;

  /**
   * Deterministic settlement time.
   */
  settledAt:
    number;
}

/* =========================================
 * SETTLEMENT ENGINE
 * =======================================*/

/**
 * Deterministic protocol
 * settlement persistence.
 *
 * Responsible for:
 *
 * - storing execution outcomes
 * - preserving immutable results
 * - enabling auditability
 * - supporting validator synchronization
 */
export class SettlementEngine {
  /**
   * Immutable settlement store.
   */
  private readonly settlements =
    new Map<
      HashDigest,
      SettlementRecord
    >();

  /* =====================================
   * SETTLEMENT PERSISTENCE
   * ===================================*/

/**
 * Persist immutable
 * settlement record.
 */
settle(
  record:
    SettlementRecord,
): void {
  this.settlements.set(
    record.digest,
    record,
  );
}

/**
 * Persist settlement record.
 *
 * Alias for settle().
 */
async persist(
  record:
    SettlementRecord,
): Promise<void> {
  this.settle(
    record,
  );
}

  /* =====================================
   * LOOKUP
   * ===================================*/

  /**
   * Retrieve settlement record.
   */
  getSettlement(
    digest:
      HashDigest,
  ):
    | SettlementRecord
    | undefined {
    return this.settlements.get(
      digest,
    );
  }

  /**
   * Detect settled execution.
   */
  hasSettlement(
    digest:
      HashDigest,
  ): boolean {
    return this.settlements.has(
      digest,
    );
  }

  /* =====================================
   * STORAGE MANAGEMENT
   * ===================================*/

  /**
   * Remove settlement record.
   *
   * Primarily intended for:
   * - tests
   * - local development
   * - temporary execution environments
   */
  deleteSettlement(
    digest:
      HashDigest,
  ): boolean {
    return this.settlements.delete(
      digest,
    );
  }

  /**
   * Reset settlement state.
   */
  clear(): void {
    this.settlements.clear();
  }

  /**
   * Total settlement records.
   */
  size(): number {
    return this.settlements.size;
  }

  /* =====================================
   * SETTLEMENT QUERIES
   * ===================================*/

  /**
   * Retrieve all settlements.
   *
   * Returned as immutable snapshot.
   */
  getAllSettlements():
    readonly SettlementRecord[] {
    return [
      ...this.settlements.values(),
    ];
  }
}