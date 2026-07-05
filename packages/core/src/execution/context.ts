import type {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  SettlementEngine,
} from "../state/settlement.js";

import type {
  ProtocolStateMachine,
} from "../state/state-machine.js";

import type {
  ExecutionHandler,
} from "./handlers.js";

/* =========================================
 * EXECUTION METADATA
 * =======================================*/

/**
 * Runtime execution metadata.
 *
 * Used for:
 *
 * - tracing
 * - observability
 * - diagnostics
 * - distributed coordination
 */
export interface ExecutionMetadata {
  /**
   * Unique execution identifier.
   */
  executionId:
    string;

  /**
   * Execution start time.
   */
  startedAt:
    number;

  /**
   * Optional executor identity.
   */
  executor?:
    string;

  /**
   * Arbitrary execution labels.
   */
  labels?:
    Record<
      string,
      string
    >;
}

/* =========================================
 * EXECUTION CONTEXT
 * =======================================*/

/**
 * Deterministic protocol
 * execution context.
 *
 * Represents ALL runtime state
 * associated with a single
 * protocol request lifecycle.
 *
 * Shared across:
 *
 * - execution handlers
 * - settlement layer
 * - orchestration engines
 * - validator pipelines
 */
export interface ExecutionContext {
  /**
   * Canonical protocol envelope.
   */
  envelope:
    Envelope;

  /**
   * Deterministic request digest.
   */
  digest:
    HashDigest;

  /**
   * Runtime lifecycle controller.
   */
  stateMachine:
    ProtocolStateMachine;

  /**
   * Settlement persistence layer.
   */
  settlement:
    SettlementEngine;

  /**
   * Execution handler registry.
   */
  handlers:
    ReadonlyMap<
      string,
      ExecutionHandler
    >;

  /**
   * Runtime execution metadata.
   */
  metadata:
    ExecutionMetadata;
}

/* =========================================
 * EXECUTION CONTEXT FACTORY
 * =======================================*/

/**
 * Creates immutable execution context.
 *
 * This centralizes runtime construction
 * and guarantees deterministic structure.
 */
export function createExecutionContext(
  context:
    ExecutionContext,
): Readonly<ExecutionContext> {
  return Object.freeze(
    context,
  );
}