import {
  isTerminalState,
  isValidTransition,
  ProtocolState,
} from "./transitions.js";

/* =========================================
 * STATE TRANSITION RECORD
 * =======================================*/

/**
 * Immutable protocol
 * transition event.
 *
 * Used for:
 *
 * - auditability
 * - execution tracing
 * - validator synchronization
 * - settlement history
 */
export interface StateTransitionRecord {
  /**
   * Previous protocol state.
   */
  from:
    ProtocolState;

  /**
   * Next protocol state.
   */
  to:
    ProtocolState;

  /**
   * Deterministic transition time.
   */
  transitionedAt:
    number;
}

/* =========================================
 * STATE MACHINE ERRORS
 * =======================================*/

/**
 * Canonical lifecycle
 * transition failures.
 */
export enum StateMachineError {
  /**
   * Illegal lifecycle transition.
   */
  INVALID_TRANSITION =
    "INVALID_TRANSITION",

  /**
   * Attempted mutation
   * after terminal state.
   */
  TERMINAL_STATE =
    "TERMINAL_STATE",
}

/* =========================================
 * TRANSITION RESULT
 * =======================================*/

/**
 * Deterministic transition result.
 */
export interface StateTransitionResult {
  /**
   * Transition success state.
   */
  success:
    boolean;

  /**
   * Previous lifecycle state.
   */
  previousState:
    ProtocolState;

  /**
   * Current lifecycle state.
   */
  currentState:
    ProtocolState;

  /**
   * Failure classification.
   */
  error?:
    StateMachineError;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * PROTOCOL STATE MACHINE
 * =======================================*/

/**
 * Deterministic execution
 * lifecycle controller.
 *
 * Responsible for:
 *
 * - enforcing legal transitions
 * - preventing invalid execution flow
 * - preserving terminal immutability
 * - recording execution history
 * - validator-safe state progression
 *
 * Flow:
 *
 * current state
 * -> validate transition
 * -> reject illegal movement
 * -> persist transition history
 * -> advance lifecycle state
 */
export class ProtocolStateMachine {
  /**
   * Current protocol state.
   */
  private currentState:
    ProtocolState;

  /**
   * Immutable transition history.
   */
  private readonly history:
    StateTransitionRecord[] =
      [];

  /* =====================================
   * CONSTRUCTOR
   * ===================================*/

  /**
   * Create lifecycle machine.
   */
  constructor(
    initialState:
      ProtocolState =
        ProtocolState.RECEIVED,
  ) {
    this.currentState =
      initialState;
  }

  /* =====================================
   * STATE ACCESSORS
   * ===================================*/

  /**
   * Current lifecycle state.
   */
  getState():
    ProtocolState {

    return this.currentState;
  }

  /**
   * Immutable transition history.
   */
  getHistory():
    readonly StateTransitionRecord[] {

    return [
      ...this.history,
    ];
  }

  /**
   * Detect terminal lifecycle.
   */
  isTerminal():
    boolean {

    return isTerminalState(
      this.currentState,
    );
  }

  /**
   * Total lifecycle transitions.
   */
  transitionCount():
    number {

    return this.history.length;
  }

  /* =====================================
   * TRANSITION VALIDATION
   * ===================================*/

  /**
   * Detect whether transition
   * is currently legal.
   */
  canTransition(
    nextState:
      ProtocolState,
  ): boolean {

    if (
      isTerminalState(
        this.currentState,
      )
    ) {
      return false;
    }

    return isValidTransition(
      this.currentState,
      nextState,
    );
  }

  /* =====================================
   * TRANSITION EXECUTION
   * ===================================*/

  /**
   * Execute deterministic
   * protocol lifecycle transition.
   *
   * Illegal transitions
   * MUST fail deterministically.
   */
  transition(
    nextState:
      ProtocolState,

    transitionedAt:
      number = Date.now(),
  ):
    StateTransitionResult {

    /**
     * Previous lifecycle state.
     */
    const previousState =
      this.currentState;

    /* ===================================
     * TERMINAL ENFORCEMENT
     * =================================*/

    if (
      isTerminalState(
        previousState,
      )
    ) {
      return {
        success: false,

        previousState,

        currentState:
          previousState,

        error:
          StateMachineError.TERMINAL_STATE,

        reason:
          "Terminal protocol state cannot transition",
      };
    }

    /* ===================================
     * TRANSITION VALIDATION
     * =================================*/

    const valid =
      isValidTransition(
        previousState,
        nextState,
      );

    if (
      !valid
    ) {
      return {
        success: false,

        previousState,

        currentState:
          previousState,

        error:
          StateMachineError.INVALID_TRANSITION,

        reason:
          `Invalid transition from ${previousState} to ${nextState}`,
      };
    }

    /* ===================================
     * PERSIST TRANSITION
     * =================================*/

    this.history.push(
      Object.freeze({
        from:
          previousState,

        to:
          nextState,

        transitionedAt,
      }),
    );

    /* ===================================
     * ADVANCE STATE
     * =================================*/

    this.currentState =
      nextState;

    /* ===================================
     * SUCCESS
     * =================================*/

    return {
      success: true,

      previousState,

      currentState:
        this.currentState,
    };
  }

  /* =====================================
   * RESET
   * ===================================*/

  /**
   * Reset lifecycle machine.
   *
   * Intended for:
   *
   * - testing
   * - simulations
   * - validator replay
   * - local development
   */
  reset(
    state:
      ProtocolState =
        ProtocolState.RECEIVED,
  ): void {

    this.currentState =
      state;

    this.history.length =
      0;
  }
}