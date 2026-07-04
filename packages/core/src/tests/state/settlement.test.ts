import {
  describe,
  expect,
  it,
} from "vitest";

import {
  SettlementEngine,
  SettlementStatus,
  type SettlementRecord,
} from "../../state/settlement.js";

import {
  ProtocolState,
} from "../../state/transitions.js";

import type {
  Envelope,
} from "../../base/envelope.js";

import type {
  HashDigest,
} from "../../crypto/hashing.js";

import {
  createIdentity,
} from "../../crypto/identity.js";

/* =========================================
 * TEST HELPERS
 * =======================================*/

/**
 * Creates deterministic
 * test digest.
 */
function createDigest(
  value: string,
): HashDigest {
  return value as HashDigest;
}

describe(
  "SettlementEngine",
  () => {
    /* =====================================
     * TEST FIXTURES
     * ===================================*/

    const identity =
      createIdentity(
        "settlement-test-node",
      );

    const envelope: Envelope = {
      header: {
        messageId:
          "msg-1",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          identity.address,

        publicKey:
          identity.publicKey,

        timestamp:
          1720000000,

        nonce: 1,

        sequence: 1,

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
          "PAYMENT",

        amount: 100,
      },

      signature:
        "0xabcdef1234567890",
    };

    const digest =
      createDigest(
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      );

    const settlementRecord:
      SettlementRecord = {
      digest,

      envelope,

      state:
        ProtocolState.FINALIZED,

      status:
        SettlementStatus.SUCCESS,

      result: {
        transactionId:
          "tx-1",
      },

      settledAt:
        1720000100,
    };

    /* =====================================
     * INITIAL STATE
     * ===================================*/

    it(
      "starts with empty settlement store",
      () => {
        const engine =
          new SettlementEngine();

        expect(
          engine.size(),
        ).toBe(0);
      },
    );

    /* =====================================
     * SETTLEMENT PERSISTENCE
     * ===================================*/

    it(
      "persists settlement records",
      () => {
        const engine =
          new SettlementEngine();

        engine.settle(
          settlementRecord,
        );

        expect(
          engine.size(),
        ).toBe(1);

        expect(
          engine.hasSettlement(
            digest,
          ),
        ).toBe(true);
      },
    );

    it(
      "retrieves settlement records",
      () => {
        const engine =
          new SettlementEngine();

        engine.settle(
          settlementRecord,
        );

        const stored =
          engine.getSettlement(
            digest,
          );

        expect(
          stored,
        ).toEqual(
          settlementRecord,
        );
      },
    );

    it(
      "returns undefined for unknown settlement",
      () => {
        const engine =
          new SettlementEngine();

        const unknownDigest =
          createDigest(
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          );

        expect(
          engine.getSettlement(
            unknownDigest,
          ),
        ).toBeUndefined();
      },
    );

    /* =====================================
     * FAILURE SETTLEMENTS
     * ===================================*/

    it(
      "stores failed settlement records",
      () => {
        const engine =
          new SettlementEngine();

        const failedRecord:
          SettlementRecord = {
          digest,

          envelope,

          state:
            ProtocolState.REJECTED,

          status:
            SettlementStatus.FAILURE,

          error:
            "Signature verification failed",

          settledAt:
            1720000200,
        };

        engine.settle(
          failedRecord,
        );

        const stored =
          engine.getSettlement(
            digest,
          );

        expect(
          stored?.status,
        ).toBe(
          SettlementStatus.FAILURE,
        );

        expect(
          stored?.error,
        ).toBe(
          "Signature verification failed",
        );
      },
    );

    /* =====================================
     * SETTLEMENT DELETION
     * ===================================*/

    it(
      "deletes settlement records",
      () => {
        const engine =
          new SettlementEngine();

        engine.settle(
          settlementRecord,
        );

        expect(
          engine.deleteSettlement(
            digest,
          ),
        ).toBe(true);

        expect(
          engine.hasSettlement(
            digest,
          ),
        ).toBe(false);

        expect(
          engine.size(),
        ).toBe(0);
      },
    );

    it(
      "returns false when deleting unknown settlement",
      () => {
        const engine =
          new SettlementEngine();

        expect(
          engine.deleteSettlement(
            digest,
          ),
        ).toBe(false);
      },
    );

    /* =====================================
     * CLEAR STORAGE
     * ===================================*/

    it(
      "clears all settlement records",
      () => {
        const engine =
          new SettlementEngine();

        engine.settle(
          settlementRecord,
        );

        engine.clear();

        expect(
          engine.size(),
        ).toBe(0);

        expect(
          engine.hasSettlement(
            digest,
          ),
        ).toBe(false);
      },
    );

    /* =====================================
     * ALL SETTLEMENTS
     * ===================================*/

    it(
      "returns all settlements",
      () => {
        const engine =
          new SettlementEngine();

        engine.settle(
          settlementRecord,
        );

        const all =
          engine.getAllSettlements();

        expect(
          all.length,
        ).toBe(1);

        expect(
          all[0],
        ).toEqual(
          settlementRecord,
        );
      },
    );
  },
);