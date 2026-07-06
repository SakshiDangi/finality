import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ProtocolStateMachine,
  StateMachineError,
} from "../../state/state-machine.js";

import {
  ProtocolState,
} from "../../state/transitions.js";

describe(
  "ProtocolStateMachine",
  () => {
    /* =====================================
     * INITIAL STATE
     * ===================================*/

    it(
      "starts in RECEIVED state by default",
      () => {
        const machine =
          new ProtocolStateMachine();

        expect(
          machine.getState(),
        ).toBe(
          ProtocolState.RECEIVED,
        );
      },
    );

    it(
      "supports custom initial state",
      () => {
        const machine =
          new ProtocolStateMachine(
            ProtocolState.VERIFIED,
          );

        expect(
          machine.getState(),
        ).toBe(
          ProtocolState.VERIFIED,
        );
      },
    );

    /* =====================================
     * VALID TRANSITIONS
     * ===================================*/

    it(
      "executes valid state transitions",
      () => {
        const machine =
          new ProtocolStateMachine();

        const result =
          machine.transition(
            ProtocolState.VERIFIED,
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          result.currentState,
        ).toBe(
          ProtocolState.VERIFIED,
        );

        expect(
          machine.getState(),
        ).toBe(
          ProtocolState.VERIFIED,
        );
      },
    );

    it(
      "executes full lifecycle progression",
      () => {
        const machine =
          new ProtocolStateMachine();

        expect(
          machine.transition(
            ProtocolState.VERIFIED,
          ).success,
        ).toBe(true);

        expect(
          machine.transition(
            ProtocolState.REPLAY_CHECKED,
          ).success,
        ).toBe(true);

        expect(
          machine.transition(
            ProtocolState.EXECUTING,
          ).success,
        ).toBe(true);

        expect(
          machine.transition(
            ProtocolState.SETTLED,
          ).success,
        ).toBe(true);

        expect(
          machine.transition(
            ProtocolState.FINALIZED,
          ).success,
        ).toBe(true);

        expect(
          machine.getState(),
        ).toBe(
          ProtocolState.FINALIZED,
        );
      },
    );

    /* =====================================
     * INVALID TRANSITIONS
     * ===================================*/

    it(
      "rejects illegal lifecycle transitions",
      () => {
        const machine =
          new ProtocolStateMachine();

        const result =
          machine.transition(
            ProtocolState.SETTLED,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          StateMachineError.INVALID_TRANSITION,
        );

        expect(
          machine.getState(),
        ).toBe(
          ProtocolState.RECEIVED,
        );
      },
    );

    it(
      "prevents skipping lifecycle stages",
      () => {
        const machine =
          new ProtocolStateMachine();

        machine.transition(
          ProtocolState.VERIFIED,
        );

        const result =
          machine.transition(
            ProtocolState.SETTLED,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          StateMachineError.INVALID_TRANSITION,
        );
      },
    );

    /* =====================================
     * TERMINAL STATES
     * ===================================*/

    it(
      "detects terminal FINALIZED state",
      () => {
        const machine =
          new ProtocolStateMachine();

        machine.transition(
          ProtocolState.VERIFIED,
        );

        machine.transition(
          ProtocolState.REPLAY_CHECKED,
        );

        machine.transition(
          ProtocolState.EXECUTING,
        );

        machine.transition(
          ProtocolState.SETTLED,
        );

        machine.transition(
          ProtocolState.FINALIZED,
        );

        expect(
          machine.isTerminal(),
        ).toBe(true);
      },
    );

    it(
      "rejects transitions after FINALIZED",
      () => {
        const machine =
          new ProtocolStateMachine();

        machine.transition(
          ProtocolState.VERIFIED,
        );

        machine.transition(
          ProtocolState.REPLAY_CHECKED,
        );

        machine.transition(
          ProtocolState.EXECUTING,
        );

        machine.transition(
          ProtocolState.SETTLED,
        );

        machine.transition(
          ProtocolState.FINALIZED,
        );

        const result =
          machine.transition(
            ProtocolState.RECEIVED,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          StateMachineError.TERMINAL_STATE,
        );
      },
    );

    it(
      "rejects transitions after REJECTED",
      () => {
        const machine =
          new ProtocolStateMachine();

        machine.transition(
          ProtocolState.REJECTED,
        );

        const result =
          machine.transition(
            ProtocolState.VERIFIED,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          StateMachineError.TERMINAL_STATE,
        );
      },
    );

    /* =====================================
     * TRANSITION HISTORY
     * ===================================*/

    it(
      "records immutable transition history",
      () => {
        const machine =
          new ProtocolStateMachine();

        machine.transition(
          ProtocolState.VERIFIED,
          100,
        );

        machine.transition(
          ProtocolState.REPLAY_CHECKED,
          200,
        );

        const history =
          machine.getHistory();

        expect(
          history.length,
        ).toBe(2);

        expect(
          history[0],
        ).toEqual({
          from:
            ProtocolState.RECEIVED,

          to:
            ProtocolState.VERIFIED,

          timestamp: 100,
        });

        expect(
          history[1],
        ).toEqual({
          from:
            ProtocolState.VERIFIED,

          to:
            ProtocolState.REPLAY_CHECKED,

          timestamp: 200,
        });
      },
    );

    it(
      "returns immutable history snapshot",
      () => {
        const machine =
          new ProtocolStateMachine();

        machine.transition(
          ProtocolState.VERIFIED,
        );

        const history =
          machine.getHistory();

        expect(() => {
          (
            history as unknown as Array<unknown>
          ).push(
            "mutation",
          );
        }).not.toThrow();

        /**
         * Internal history
         * remains protected.
         */
        expect(
          machine.getHistory()
            .length,
        ).toBe(1);
      },
    );
  },
);