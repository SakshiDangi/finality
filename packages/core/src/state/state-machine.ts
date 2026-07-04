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
  timestamp:
    number;
}

/* =========================================
 * STATE MACHINE ERRORS
 * =======================================*/

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

export interface StateTransitionResult {
  /**
   * Transition success state.
   */
  success: boolean;

  /**
   * Current protocol state.
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
  reason?: string;
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

  /**
   * Create new lifecycle machine.
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

  /* =====================================
   * TRANSITION EXECUTION
   * ===================================*/

  /**
   * Executes deterministic
   * protocol state transition.
   */
  transition(
    nextState:
      ProtocolState,

    timestamp:
      number = Date.now(),
  ): StateTransitionResult {
    /**
     * Terminal states
     * cannot mutate.
     */
    if (
      isTerminalState(
        this.currentState,
      )
    ) {
      return {
        success: false,

        currentState:
          this.currentState,

        error:
          StateMachineError.TERMINAL_STATE,

        reason:
          "Terminal protocol state cannot transition",
      };
    }

    /**
     * Validate lifecycle transition.
     */
    if (
      !isValidTransition(
        this.currentState,
        nextState,
      )
    ) {
      return {
        success: false,

        currentState:
          this.currentState,

        error:
          StateMachineError.INVALID_TRANSITION,

        reason:
          `Invalid transition from ${this.currentState} to ${nextState}`,
      };
    }

    /**
     * Persist immutable
     * transition history.
     */
    this.history.push({
      from:
        this.currentState,

      to:
        nextState,

      timestamp,
    });

    /**
     * Advance lifecycle state.
     */
    this.currentState =
      nextState;

    /**
     * Successful transition.
     */
    return {
      success: true,

      currentState:
        this.currentState,
    };
  }
}