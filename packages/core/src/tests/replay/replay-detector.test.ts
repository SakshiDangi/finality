import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  Envelope,
} from "../../base/envelope.js";

import {
  detectReplay,
  ReplayDetectionError,
  ReplayDetectorContext,
} from "../../replay/replay-detector.js";

import {
  InMemoryReplayCache,
} from "../../replay/replay-cache.js";

import {
  InMemoryNonceManager,
} from "../../replay/nonce-manager.js";

describe(
  "detectReplay",
  () => {
    let context:
      ReplayDetectorContext;

    beforeEach(() => {
      context = {
        replayCache:
          new InMemoryReplayCache(),

        nonceManager:
          new InMemoryNonceManager(),

        currentTime:
          Date.now(),
      };
    });

    /* =====================================
     * TEST ENVELOPE
     * ===================================*/

    function createEnvelope(
      nonce: number,
    ): Envelope {
      return {
        header: {
          messageId:
            `msg-${nonce}`,

          domain:
            "FINALITY_CORE_V1",

          messageKind:
            "REQUEST",

          sender:
            "0x1111111111111111111111111111111111111111",
          
          publicKey:
            "0x" + "11".repeat(33),

          timestamp:
            Date.now(),

          nonce,

          sequence:
            nonce,

          ttl:
            30_000,

          signatureAlgorithm:
            "SECP256K1",

          priority:
            "NORMAL",

          protocol:
            "FINALITY",

          version:
            "1.0.0",
        },

        payload: {
          action:
            "TRANSFER",

          amount: 100,
        },

        signature:
          "0xsignature",
      };
    }

    /* =====================================
     * VALID EXECUTION
     * ===================================*/

    it(
      "accepts fresh envelopes",
      () => {
        const envelope =
          createEnvelope(1);

        const result =
          detectReplay(
            envelope,
            context,
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          result.digest,
        ).toBeDefined();

        expect(
          result.nonce,
        ).toBe(1);
      },
    );

    /* =====================================
     * DIGEST REPLAY
     * ===================================*/

    it(
      "rejects digest replay attacks",
      () => {
        const envelope =
          createEnvelope(1);

        /**
         * First execution succeeds.
         */
        detectReplay(
          envelope,
          context,
        );

        /**
         * Second identical execution fails.
         */
        const replayResult =
          detectReplay(
            envelope,
            context,
          );

        expect(
          replayResult.success,
        ).toBe(false);

        expect(
          replayResult.error,
        ).toBe(
          ReplayDetectionError.DIGEST_REPLAY,
        );
      },
    );

    /* =====================================
     * NONCE REPLAY
     * ===================================*/

    it(
      "rejects reused sender nonce",
      () => {
        const envelopeA =
          createEnvelope(5);

        detectReplay(
          envelopeA,
          context,
        );

        /**
         * Different payload
         * but same nonce.
         */
        const envelopeB =
          {
            ...createEnvelope(5),

            payload: {
              action:
                "UPDATED",

              amount: 999,
            },
          };

        const result =
          detectReplay(
            envelopeB,
            context,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          ReplayDetectionError.NONCE_REPLAY,
        );
      },
    );

    /* =====================================
     * STALE NONCE
     * ===================================*/

    it(
      "rejects stale nonce ordering",
      () => {
        /**
         * Latest accepted nonce.
         */
        detectReplay(
          createEnvelope(10),
          context,
        );

        /**
         * Older nonce arrives later.
         */
        const staleEnvelope =
          createEnvelope(5);

        const result =
          detectReplay(
            staleEnvelope,
            context,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          ReplayDetectionError.NONCE_OUT_OF_ORDER,
        );
      },
    );

    /* =====================================
     * NONCE PROGRESSION
     * ===================================*/

    it(
      "accepts increasing nonce order",
      () => {
        const result1 =
          detectReplay(
            createEnvelope(1),
            context,
          );

        const result2 =
          detectReplay(
            createEnvelope(2),
            context,
          );

        const result3 =
          detectReplay(
            createEnvelope(3),
            context,
          );

        expect(
          result1.success,
        ).toBe(true);

        expect(
          result2.success,
        ).toBe(true);

        expect(
          result3.success,
        ).toBe(true);
      },
    );

    /* =====================================
     * REPLAY PERSISTENCE
     * ===================================*/

    it(
      "persists replay digest after successful execution",
      () => {
        const envelope =
          createEnvelope(100);

        const result =
          detectReplay(
            envelope,
            context,
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          context.replayCache.has(
            result.digest,
          ),
        ).toBe(true);
      },
    );

    /* =====================================
     * NONCE PERSISTENCE
     * ===================================*/

    it(
      "persists latest sender nonce",
      () => {
        detectReplay(
          createEnvelope(42),
          context,
        );

        const latestNonce =
          context.nonceManager.getNonce(
            "0x1111111111111111111111111111111111111111",
          );

        expect(
          latestNonce,
        ).toBe(42);
      },
    );
  },
);