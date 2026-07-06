import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Envelope,
  UnsignedEnvelope,
} from "../../base/envelope.js";

import type {
  HashDigest,
} from "../../base/primitives.js";

import {
  createIdentity,
} from "../../crypto/identity.js";

import {
  signEnvelope,
} from "../../crypto/signatures.js";

import {
  executeVerificationPipeline,
  PipelineStage,
} from "../../verification/pipeline.js";

import {
  createSigningDigest,
} from "../../verification/signature.js";

import {
  ProtocolStateMachine,
} from "../../state/state-machine.js";

import {
  SettlementEngine,
  SettlementStatus,
} from "../../state/settlement.js";

import {
  ProtocolState,
} from "../../state/transitions.js";

describe(
  "Protocol Integration Pipeline",
  () => {
    /* =====================================
     * TEST FIXTURES
     * ===================================*/

    const identity =
      createIdentity(
        "validator-1",
      );

    function createEnvelope(
      nonce: number,
    ): Envelope {
      const unsigned:
        UnsignedEnvelope = {
        header: {
          messageId:
            `msg-${nonce}`,

          domain:
            "FINALITY_CORE_V1",

          protocol:
            "FINALITY",

          version:
            "1.0.0",

          messageKind:
            "REQUEST",

          sender:
            identity.address,

          publicKey:
            identity.publicKey,

          timestamp:
            Date.now(),

          nonce,

          sequence:
            nonce,

          ttl:
            60_000,

          signatureAlgorithm:
            "SECP256K1",

          priority:
            "NORMAL",
        },

        payload: {
          action:
            "PAYMENT",

          amount:
            100,
        },
      };

      const signature =
        signEnvelope(
          unsigned,
          identity.privateKey,
        );

      return {
        ...unsigned,
        signature,
      };
    }

    /* =====================================
     * VALID EXECUTION FLOW
     * ===================================*/

    it(
      "executes full protocol lifecycle",
      () => {
        const envelope =
          createEnvelope(1);

        /**
         * STEP 1
         * Verification pipeline
         */
        const pipeline =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce:
                  0,

                timestampOptions: {
                  maxFutureDriftMs:
                    60_000,

                  minTTL:
                    1_000,

                  maxTTL:
                    300_000,
                },
              },
            },
          );

        expect(
          pipeline.success,
        ).toBe(true);

        expect(
          pipeline.stage,
        ).toBe(
          PipelineStage.VERIFIED,
        );

        /**
         * STEP 2
         * Lifecycle state machine
         */
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

        /**
         * STEP 3
         * Settlement persistence
         */
        const settlement =
          new SettlementEngine();

        const digest =
          createSigningDigest(
            envelope,
          ) as HashDigest;

        settlement.settle({
          digest,

          envelope,

          state:
            ProtocolState.FINALIZED,

          status:
            SettlementStatus.SUCCESS,

          settledAt:
            Date.now(),
        });

        expect(
          settlement.hasSettlement(
            digest,
          ),
        ).toBe(true);
      },
    );

    /* =====================================
     * INVALID SIGNATURE
     * ===================================*/

    it(
      "rejects tampered payloads",
      () => {
        const envelope =
          createEnvelope(2);

        /**
         * Tamper AFTER signing.
         */
        (
          envelope.payload as {
            amount: number;
          }
        ).amount = 999999;

        const pipeline =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce:
                  0,

                timestampOptions: {
                  maxFutureDriftMs:
                    60_000,

                  minTTL:
                    1_000,

                  maxTTL:
                    300_000,
                },
              },
            },
          );

        expect(
          pipeline.success,
        ).toBe(false);

        expect(
          pipeline.stage,
        ).toBe(
          PipelineStage.REJECTED,
        );
      },
    );

    /* =====================================
     * NONCE REPLAY
     * ===================================*/

    it(
      "rejects nonce replay",
      () => {
        const envelope =
          createEnvelope(1);

        const pipeline =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                /**
                 * Nonce already used.
                 */
                latestNonce:
                  1,

                timestampOptions: {
                  maxFutureDriftMs:
                    60_000,

                  minTTL:
                    1_000,

                  maxTTL:
                    300_000,
                },
              },
            },
          );

        expect(
          pipeline.success,
        ).toBe(false);

        expect(
          pipeline.stage,
        ).toBe(
          PipelineStage.REJECTED,
        );
      },
    );

    /* =====================================
     * STALE TIMESTAMP
     * ===================================*/

    it(
      "rejects stale envelopes",
      () => {
        const envelope =
          createEnvelope(4);

        /**
         * Expire message.
         */
        envelope.header.timestamp =
          Date.now() - 120_000;

        envelope.header.ttl =
          1_000;

        const pipeline =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce:
                  0,

                timestampOptions: {
                  maxFutureDriftMs:
                    1_000,

                  minTTL:
                    1_000,

                  maxTTL:
                    300_000,
                },
              },
            },
          );

        expect(
          pipeline.success,
        ).toBe(false);

        expect(
          pipeline.stage,
        ).toBe(
          PipelineStage.REJECTED,
        );
      },
    );

    /* =====================================
     * INVALID STATE TRANSITION
     * ===================================*/

    it(
      "rejects illegal lifecycle transitions",
      () => {
        const machine =
          new ProtocolStateMachine();

        const result =
          machine.transition(
            ProtocolState.FINALIZED,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);