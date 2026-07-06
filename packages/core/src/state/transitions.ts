/* =========================================
 * PROTOCOL STATES
 * =======================================*/

/**
 * Deterministic protocol lifecycle.
 *
 * Every request progresses through
 * a canonical distributed state machine.
 *
 * Guarantees:
 *
 * - deterministic execution
 * - replay-safe progression
 * - validator consistency
 * - immutable finality
 * - distributed auditability
 */
export enum ProtocolState {

  /**
   * Request entered protocol pipeline.
   */
  RECEIVED =
    "RECEIVED",

  /**
   * Signature + payload verification passed.
   */
  VERIFIED =
    "VERIFIED",

  /**
   * Replay protection succeeded.
   */
  REPLAY_CHECKED =
    "REPLAY_CHECKED",

  /**
   * Runtime execution started.
   */
  EXECUTING =
    "EXECUTING",

  /**
   * Runtime execution completed.
   */
  EXECUTED =
    "EXECUTED",

  /**
   * Settlement receipt generated.
   */
  SETTLED =
    "SETTLED",

  /**
   * Validator attestation completed.
   */
  ATTESTED =
    "ATTESTED",

  /**
   * Distributed consensus finalized.
   */
  FINALIZED =
    "FINALIZED",

  /**
   * Irrecoverable protocol failure.
   */
  REJECTED =
    "REJECTED",
}

/* =========================================
 * TERMINAL STATES
 * =======================================*/

/**
 * Immutable terminal states.
 *
 * Once entered:
 *
 * - no further transitions allowed
 * - state becomes immutable
 * - execution lifecycle closes
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
 * Canonical protocol transition graph.
 *
 * Defines ALL legal lifecycle transitions.
 *
 * Invalid transitions MUST always fail.
 */
export const STATE_TRANSITIONS:
  Readonly<
    Record<
      ProtocolState,
      readonly ProtocolState[]
    >
  > = {

  /* =====================================
   * REQUEST RECEIVED
   * ===================================*/

  [ProtocolState.RECEIVED]: [
    ProtocolState.VERIFIED,
    ProtocolState.REJECTED,
  ],

  /* =====================================
   * VERIFICATION COMPLETE
   * ===================================*/

  [ProtocolState.VERIFIED]: [
    ProtocolState.REPLAY_CHECKED,
    ProtocolState.REJECTED,
  ],

  /* =====================================
   * REPLAY VALIDATION COMPLETE
   * ===================================*/

  [ProtocolState.REPLAY_CHECKED]: [
    ProtocolState.EXECUTING,
    ProtocolState.REJECTED,
  ],

  /* =====================================
   * EXECUTION STARTED
   * ===================================*/

  [ProtocolState.EXECUTING]: [
    ProtocolState.EXECUTED,
    ProtocolState.REJECTED,
  ],

  /* =====================================
   * EXECUTION COMPLETE
   * ===================================*/

  [ProtocolState.EXECUTED]: [
    ProtocolState.SETTLED,
    ProtocolState.REJECTED,
  ],

  /* =====================================
   * SETTLEMENT COMPLETE
   * ===================================*/

  [ProtocolState.SETTLED]: [
    ProtocolState.ATTESTED,
    ProtocolState.REJECTED,
  ],

  /* =====================================
   * VALIDATOR ATTESTATION COMPLETE
   * ===================================*/

  [ProtocolState.ATTESTED]: [
    ProtocolState.FINALIZED,
    ProtocolState.REJECTED,
  ],

  /* =====================================
   * TERMINAL SUCCESS
   * ===================================*/

  [ProtocolState.FINALIZED]: [],

  /* =====================================
   * TERMINAL FAILURE
   * ===================================*/

  [ProtocolState.REJECTED]: [],
} as const;

/* =========================================
 * TRANSITION VALIDATION
 * =======================================*/

/**
 * Validates lifecycle transition legality.
 *
 * Used by:
 *
 * - execution engines
 * - consensus layers
 * - settlement pipelines
 * - orchestration systems
 * - validators
 */
export function isValidTransition(
  currentState:
    ProtocolState,

  nextState:
    ProtocolState,
): boolean {

  return STATE_TRANSITIONS[
    currentState
  ].includes(
    nextState,
  );
}

/* =========================================
 * TERMINAL STATE CHECK
 * =======================================*/

/**
 * Detect immutable terminal states.
 */
export function isTerminalState(
  state:
    ProtocolState,
): boolean {

  return TERMINAL_STATES.has(
    state,
  );
}