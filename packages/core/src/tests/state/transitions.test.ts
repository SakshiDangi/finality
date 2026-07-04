import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isTerminalState,
  isValidTransition,
  ProtocolState,
  STATE_TRANSITIONS,
  TERMINAL_STATES,
} from "../../state/transitions.js";

describe(
  "ProtocolState transitions",
  () => {
    /* =====================================
     * STATE GRAPH
     * ===================================*/

    it(
      "defines transitions for all protocol states",
      () => {
        for (const state of Object.values(
          ProtocolState,
        )) {
          expect(
            STATE_TRANSITIONS[
              state
            ],
          ).toBeDefined();
        }
      },
    );

    /* =====================================
     * VALID TRANSITIONS
     * ===================================*/

    it(
      "allows RECEIVED -> VERIFIED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.RECEIVED,
            ProtocolState.VERIFIED,
          ),
        ).toBe(true);
      },
    );

    it(
      "allows VERIFIED -> REPLAY_CHECKED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.VERIFIED,
            ProtocolState.REPLAY_CHECKED,
          ),
        ).toBe(true);
      },
    );

    it(
      "allows REPLAY_CHECKED -> EXECUTING",
      () => {
        expect(
          isValidTransition(
            ProtocolState.REPLAY_CHECKED,
            ProtocolState.EXECUTING,
          ),
        ).toBe(true);
      },
    );

    it(
      "allows EXECUTING -> SETTLED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.EXECUTING,
            ProtocolState.SETTLED,
          ),
        ).toBe(true);
      },
    );

    it(
      "allows SETTLED -> FINALIZED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.SETTLED,
            ProtocolState.FINALIZED,
          ),
        ).toBe(true);
      },
    );

    /* =====================================
     * REJECTION PATHS
     * ===================================*/

    it(
      "allows RECEIVED -> REJECTED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.RECEIVED,
            ProtocolState.REJECTED,
          ),
        ).toBe(true);
      },
    );

    it(
      "allows VERIFIED -> REJECTED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.VERIFIED,
            ProtocolState.REJECTED,
          ),
        ).toBe(true);
      },
    );

    it(
      "allows EXECUTING -> REJECTED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.EXECUTING,
            ProtocolState.REJECTED,
          ),
        ).toBe(true);
      },
    );

    /* =====================================
     * INVALID TRANSITIONS
     * ===================================*/

    it(
      "rejects RECEIVED -> FINALIZED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.RECEIVED,
            ProtocolState.FINALIZED,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects VERIFIED -> SETTLED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.VERIFIED,
            ProtocolState.SETTLED,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects FINALIZED -> RECEIVED",
      () => {
        expect(
          isValidTransition(
            ProtocolState.FINALIZED,
            ProtocolState.RECEIVED,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects REJECTED -> EXECUTING",
      () => {
        expect(
          isValidTransition(
            ProtocolState.REJECTED,
            ProtocolState.EXECUTING,
          ),
        ).toBe(false);
      },
    );

    /* =====================================
     * TERMINAL STATES
     * ===================================*/

    it(
      "detects FINALIZED as terminal",
      () => {
        expect(
          isTerminalState(
            ProtocolState.FINALIZED,
          ),
        ).toBe(true);
      },
    );

    it(
      "detects REJECTED as terminal",
      () => {
        expect(
          isTerminalState(
            ProtocolState.REJECTED,
          ),
        ).toBe(true);
      },
    );

    it(
      "detects EXECUTING as non-terminal",
      () => {
        expect(
          isTerminalState(
            ProtocolState.EXECUTING,
          ),
        ).toBe(false);
      },
    );

    it(
      "tracks all terminal states",
      () => {
        expect(
          TERMINAL_STATES.has(
            ProtocolState.FINALIZED,
          ),
        ).toBe(true);

        expect(
          TERMINAL_STATES.has(
            ProtocolState.REJECTED,
          ),
        ).toBe(true);
      },
    );
  },
);