import type {
  HashDigest,
} from "../base/primitives.js";

import {
  ProtocolState,
} from "../state/transitions.js";

/* =========================================
 * EVENT TYPES
 * =======================================*/

/**
 * Canonical protocol
 * lifecycle event types.
 */
export enum ExecutionEventType {

  REQUEST_RECEIVED =
    "REQUEST_RECEIVED",

  REQUEST_VERIFIED =
    "REQUEST_VERIFIED",

  REPLAY_CHECKED =
    "REPLAY_CHECKED",

  EXECUTION_STARTED =
    "EXECUTION_STARTED",

  EXECUTION_COMPLETED =
    "EXECUTION_COMPLETED",

  EXECUTION_FAILED =
    "EXECUTION_FAILED",

  SETTLEMENT_CREATED =
    "SETTLEMENT_CREATED",

  ATTESTATION_CREATED =
    "ATTESTATION_CREATED",

  CONSENSUS_PENDING =
    "CONSENSUS_PENDING",

  CONSENSUS_FINALIZED =
    "CONSENSUS_FINALIZED",

  CONSENSUS_REJECTED =
    "CONSENSUS_REJECTED",

  REQUEST_REJECTED =
    "REQUEST_REJECTED",
}

/* =========================================
 * EXECUTION EVENT
 * =======================================*/

/**
 * Immutable protocol event.
 *
 * Represents a deterministic
 * lifecycle transition.
 */
export interface ExecutionEvent {

  /**
   * Event type.
   */
  type:
    ExecutionEventType;

  /**
   * Request digest.
   */
  digest:
    HashDigest;

  /**
   * Current protocol state.
   */
  state:
    ProtocolState;

  /**
   * Event timestamp.
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
 * EVENT LISTENER
 * =======================================*/

/**
 * Event subscription callback.
 */
export type ExecutionEventListener =
  (
    event:
      ExecutionEvent,
  ) => void;

/* =========================================
 * EVENT EMITTER
 * =======================================*/

/**
 * Deterministic protocol
 * event emitter.
 *
 * Responsible for:
 *
 * - lifecycle streaming
 * - validator observability
 * - monitoring
 * - metrics integration
 * - audit integrations
 * - websocket broadcasting
 */
export class ExecutionEventEmitter {

  /**
   * Registered listeners.
   */
  private readonly listeners =
    new Set<
      ExecutionEventListener
    >();

  /**
   * Historical event buffer.
   */
  private readonly events:
    ExecutionEvent[] = [];

  /* =====================================
   * SUBSCRIBE
   * ===================================*/

  /**
   * Register event listener.
   */
  subscribe(
    listener:
      ExecutionEventListener,
  ): void {

    this.listeners.add(
      listener,
    );
  }

  /* =====================================
   * UNSUBSCRIBE
   * ===================================*/

  /**
   * Remove event listener.
   */
  unsubscribe(
    listener:
      ExecutionEventListener,
  ): void {

    this.listeners.delete(
      listener,
    );
  }

  /* =====================================
   * EMIT EVENT
   * ===================================*/

  /**
   * Emit immutable protocol event.
   */
  emit(
    event:
      ExecutionEvent,
  ): void {

    const frozen =
      Object.freeze({
        ...event,
      });

    this.events.push(
      frozen,
    );

    for (
      const listener
      of this.listeners
    ) {

      listener(
        frozen,
      );
    }
  }

  /* =====================================
   * GET EVENTS
   * ===================================*/

  /**
   * Retrieve all emitted events.
   */
  getEvents():
    readonly ExecutionEvent[] {

    return [
      ...this.events,
    ];
  }

  /* =====================================
   * FILTER EVENTS
   * ===================================*/

  /**
   * Retrieve events by digest.
   */
  getEventsByDigest(
    digest:
      HashDigest,
  ):
    readonly ExecutionEvent[] {

    return this.events.filter(
      event =>
        event.digest === digest,
    );
  }

  /* =====================================
   * CLEAR EVENTS
   * ===================================*/

  /**
   * Reset historical events.
   */
  clear():
    void {

    this.events.length = 0;
  }

  /* =====================================
   * TOTAL EVENTS
   * ===================================*/

  /**
   * Total emitted events.
   */
  size():
    number {

    return this.events.length;
  }
}