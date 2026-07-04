/* =========================================
 * PROTOCOL STATES
 * =======================================*/

/**
 * Deterministic protocol lifecycle.
 *
 * Every protocol request moves
 * through these states in order.
 *
 * This creates:
 *
 * - execution consistency
 * - validator agreement
 * - settlement determinism
 * - replay-safe progression
 */
export enum ProtocolState {
  /**
   * Request entered pipeline.
   */
  RECEIVED =
    "RECEIVED",

  /**
   * Cryptographic verification passed.
   */
  VERIFIED =
    "VERIFIED",

  /**
   * Replay protection passed.
   */
  REPLAY_CHECKED =
    "REPLAY_CHECKED",

  /**
   * Execution has started.
   */
  EXECUTING =
    "EXECUTING",

  /**
   * Execution completed successfully.
   */
  SETTLED =
    "SETTLED",

  /**
   * Immutable terminal success state.
   */
  FINALIZED =
    "FINALIZED",

  /**
   * Immutable terminal failure state.
   */
  REJECTED =
    "REJECTED",
}

/* =========================================
 * TERMINAL STATES
 * =======================================*/

/**
 * Terminal protocol states.
 *
 * Once entered:
 *
 * - no further transitions allowed
 * - execution becomes immutable
 */
export const TERMINAL_STATES =
  new Set<ProtocolState>([
    ProtocolState.FINALIZED,
    ProtocolState.REJECTED,
  ]);

/* =========================================
 * STATE TRANSITION GRAPH
 * =======================================*/

/**
 * Deterministic protocol
 * transition graph.
 *
 * Defines ALL legal lifecycle
 * transitions.
 *
 * Invalid transitions MUST
 * always be rejected.
 */
export const STATE_TRANSITIONS:
  Readonly<
    Record<
      ProtocolState,
      readonly ProtocolState[]
    >
  > = {
  /**
   * Initial request state.
   */
  [ProtocolState.RECEIVED]:
    [
      ProtocolState.VERIFIED,

      ProtocolState.REJECTED,
    ],

  /**
   * Verification succeeded.
   */
  [ProtocolState.VERIFIED]:
    [
      ProtocolState.REPLAY_CHECKED,

      ProtocolState.REJECTED,
    ],

  /**
   * Replay protection succeeded.
   */
  [ProtocolState.REPLAY_CHECKED]:
    [
      ProtocolState.EXECUTING,

      ProtocolState.REJECTED,
    ],

  /**
   * Execution phase.
   */
  [ProtocolState.EXECUTING]:
    [
      ProtocolState.SETTLED,

      ProtocolState.REJECTED,
    ],

  /**
   * Settlement completed.
   */
  [ProtocolState.SETTLED]:
    [
      ProtocolState.FINALIZED,
    ],

  /**
   * Immutable success state.
   */
  [ProtocolState.FINALIZED]:
    [],

  /**
   * Immutable failure state.
   */
  [ProtocolState.REJECTED]:
    [],
} as const;

/* =========================================
 * TRANSITION VALIDATION
 * =======================================*/

/**
 * Validates protocol
 * state transition.
 *
 * Used by:
 *
 * - execution engines
 * - settlement layers
 * - validators
 * - orchestration pipelines
 * - state machines
 */
export function isValidTransition(
  currentState:
    ProtocolState,

  nextState:
    ProtocolState,
): boolean {
  return STATE_TRANSITIONS[
    currentState
  ].includes(nextState);
}

/* =========================================
 * TERMINAL STATE CHECK
 * =======================================*/

/**
 * Detects immutable
 * terminal protocol states.
 */
export function isTerminalState(
  state: ProtocolState,
): boolean {
  return TERMINAL_STATES.has(
    state,
  );
}