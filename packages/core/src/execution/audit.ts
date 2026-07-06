import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  ExecutionEvent,
} from "./events.js";

import {
  ExecutionEventType,
} from "./events.js";

import {
  ProtocolState,
} from "../state/transitions.js";

/* =========================================
 * AUDIT SEVERITY
 * =======================================*/

/**
 * Audit log severity levels.
 */
export enum AuditSeverity {

  INFO =
    "INFO",

  WARNING =
    "WARNING",

  ERROR =
    "ERROR",

  CRITICAL =
    "CRITICAL",
}

/* =========================================
 * AUDIT RECORD
 * =======================================*/

/**
 * Immutable protocol
 * audit record.
 *
 * Represents a historical
 * execution timeline entry.
 */
export interface AuditRecord {

  /**
   * Unique audit identifier.
   */
  id:
    string;

  /**
   * Request digest.
   */
  digest:
    HashDigest;

  /**
   * Lifecycle event type.
   */
  event:
    ExecutionEventType;

  /**
   * Protocol lifecycle state.
   */
  state:
    ProtocolState;

  /**
   * Audit severity.
   */
  severity:
    AuditSeverity;

  /**
   * Human-readable message.
   */
  message:
    string;

  /**
   * Audit timestamp.
   */
  timestamp:
    number;

  /**
   * Optional metadata.
   */
  metadata?:
    Record<
      string,
      unknown
    >;
}

/* =========================================
 * AUDIT ENGINE
 * =======================================*/

/**
 * Deterministic protocol
 * audit engine.
 *
 * Responsible for:
 *
 * - execution audit logs
 * - validator diagnostics
 * - replay attack tracking
 * - consensus history
 * - forensic reconstruction
 * - compliance exports
 */
export class AuditEngine {

  /**
   * Immutable audit history.
   */
  private readonly records:
    AuditRecord[] = [];

  /* =====================================
   * RECORD EVENT
   * ===================================*/

  /**
   * Create audit record
   * from protocol event.
   */
  record(
    event:
      ExecutionEvent,
  ): AuditRecord {

    const record:
      AuditRecord = Object.freeze({

      id:
        crypto.randomUUID(),

      digest:
        event.digest,

      event:
        event.type,

      state:
        event.state,

      severity:
        this.resolveSeverity(
          event.type,
        ),

      message:
        this.resolveMessage(
          event,
        ),

      timestamp:
        event.timestamp,

      metadata:
        event.metadata,
    });

    this.records.push(
      record,
    );

    return record;
  }

  /* =====================================
   * RESOLVE SEVERITY
   * ===================================*/

  /**
   * Determine audit severity
   * from event type.
   */
  private resolveSeverity(
    type:
      ExecutionEventType,
  ): AuditSeverity {

    switch (type) {

      case ExecutionEventType
        .REQUEST_REJECTED:

      case ExecutionEventType
        .EXECUTION_FAILED:

      case ExecutionEventType
        .CONSENSUS_REJECTED:

        return AuditSeverity.ERROR;

      case ExecutionEventType
        .CONSENSUS_PENDING:

        return AuditSeverity.WARNING;

      default:

        return AuditSeverity.INFO;
    }
  }

  /* =====================================
   * RESOLVE MESSAGE
   * ===================================*/

private resolveMessage(
  event:
    ExecutionEvent,
): string {

  switch (event.type) {

    case ExecutionEventType
      .REQUEST_RECEIVED:

      return "Protocol request received";

    case ExecutionEventType
      .REQUEST_VERIFIED:

      return "Request verification completed";

    case ExecutionEventType
      .REPLAY_CHECKED:

      return "Replay protection validated";

    case ExecutionEventType
      .EXECUTION_STARTED:

      return "Execution handler started";

    case ExecutionEventType
      .EXECUTION_COMPLETED:

      return "Execution completed successfully";

    case ExecutionEventType
      .EXECUTION_FAILED:

      return "Execution failed";

    case ExecutionEventType
      .SETTLEMENT_CREATED:

      return "Settlement receipt created";

    case ExecutionEventType
      .ATTESTATION_CREATED:

      return "Validator attestation produced";

    case ExecutionEventType
      .CONSENSUS_FINALIZED:

      return "Consensus finalized";

    case ExecutionEventType
      .CONSENSUS_REJECTED:

      return "Consensus rejected";

    case ExecutionEventType
      .CONSENSUS_PENDING:

      return "Consensus pending";

    case ExecutionEventType
      .REQUEST_REJECTED:

      return "Protocol request rejected";

    default:

      return "Unknown protocol event";
  }
}

  /* =====================================
   * GET RECORDS
   * ===================================*/

  /**
   * Retrieve all audit records.
   */
  getRecords():
    readonly AuditRecord[] {

    return [
      ...this.records,
    ];
  }

  /* =====================================
   * FILTER BY DIGEST
   * ===================================*/

  /**
   * Retrieve request audit trail.
   */
  getRecordsByDigest(
    digest:
      HashDigest,
  ):
    readonly AuditRecord[] {

    return this.records.filter(
      record =>
        record.digest === digest,
    );
  }

  /* =====================================
   * FILTER BY SEVERITY
   * ===================================*/

  /**
   * Retrieve records by severity.
   */
  getRecordsBySeverity(
    severity:
      AuditSeverity,
  ):
    readonly AuditRecord[] {

    return this.records.filter(
      record =>
        record.severity === severity,
    );
  }

  /* =====================================
   * TOTAL RECORDS
   * ===================================*/

  /**
   * Total audit records.
   */
  size():
    number {

    return this.records.length;
  }

  /* =====================================
   * CLEAR AUDIT
   * ===================================*/

  /**
   * Reset audit history.
   */
  clear():
    void {

      this.records.length = 0;
  }
}