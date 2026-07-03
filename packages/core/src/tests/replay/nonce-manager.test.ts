import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  InMemoryNonceManager,
  NonceState,
} from "../../replay/nonce-manager.js";

import {
  ProtocolAddress,
} from "../../crypto/identity.js";

describe(
  "InMemoryNonceManager",
  () => {
    let nonceManager:
      InMemoryNonceManager;
      
    const senderA: ProtocolAddress =
      "0x1111111111111111111111111111111111111111";
    
    const senderB: ProtocolAddress =
      "0x2222222222222222222222222222222222222222";


    beforeEach(() => {
      nonceManager =
        new InMemoryNonceManager();
    });

    /* =====================================
     * INITIAL STATE
     * ===================================*/

    it(
      "starts with empty nonce state",
      () => {
        expect(
          nonceManager.size(),
        ).toBe(0);
      },
    );

    it(
      "returns 0 for unknown sender",
      () => {
        expect(
          nonceManager.getNonce(
            senderA,
          ),
        ).toBe(0);
      },
    );

    /* =====================================
     * NONCE STORAGE
     * ===================================*/

    it(
      "stores sender nonce",
      () => {
        const state:
          NonceState = {
          sender:
            senderA,

          nonce: 1,

          updatedAt:
            Date.now(),
        };

        nonceManager.setNonce(
          state,
        );

        expect(
          nonceManager.getNonce(
            senderA,
          ),
        ).toBe(1);

        expect(
          nonceManager.hasSender(
            senderA,
          ),
        ).toBe(true);

        expect(
          nonceManager.size(),
        ).toBe(1);
      },
    );

    /* =====================================
     * NONCE UPDATES
     * ===================================*/

    it(
      "updates sender nonce deterministically",
      () => {
        nonceManager.setNonce({
          sender:
            senderA,

          nonce: 1,

          updatedAt: 1,
        });

        nonceManager.setNonce({
          sender:
            senderA,

          nonce: 2,

          updatedAt: 2,
        });

        expect(
          nonceManager.getNonce(
            senderA,
          ),
        ).toBe(2);

        expect(
          nonceManager.size(),
        ).toBe(1);
      },
    );

    /* =====================================
     * MULTI-SENDER TRACKING
     * ===================================*/

    it(
      "tracks multiple senders independently",
      () => {
        nonceManager.setNonce({
          sender:
            senderA,

          nonce: 10,

          updatedAt: 1,
        });

        nonceManager.setNonce({
          sender:
            senderB,

          nonce: 20,

          updatedAt: 2,
        });

        expect(
          nonceManager.getNonce(
            senderA,
          ),
        ).toBe(10);

        expect(
          nonceManager.getNonce(
            senderB,
          ),
        ).toBe(20);

        expect(
          nonceManager.size(),
        ).toBe(2);
      },
    );

    /* =====================================
     * LOOKUP
     * ===================================*/

    it(
      "detects sender existence",
      () => {
        nonceManager.setNonce({
          sender:
            senderA,

          nonce: 7,

          updatedAt:
            Date.now(),
        });

        expect(
          nonceManager.hasSender(
            senderA,
          ),
        ).toBe(true);

        expect(
          nonceManager.hasSender(
            senderB,
          ),
        ).toBe(false);
      },
    );

    /* =====================================
     * DELETION
     * ===================================*/

    it(
      "removes sender nonce state",
      () => {
        nonceManager.setNonce({
          sender:
            senderA,

          nonce: 99,

          updatedAt:
            Date.now(),
        });

        const deleted =
          nonceManager.deleteSender(
            senderA,
          );

        expect(
          deleted,
        ).toBe(true);

        expect(
          nonceManager.hasSender(
            senderA,
          ),
        ).toBe(false);

        expect(
          nonceManager.getNonce(
            senderA,
          ),
        ).toBe(0);

        expect(
          nonceManager.size(),
        ).toBe(0);
      },
    );

    it(
      "returns false for unknown sender deletion",
      () => {
        const deleted =
          nonceManager.deleteSender(
            senderA,
          );

        expect(
          deleted,
        ).toBe(false);
      },
    );

    /* =====================================
     * RESET
     * ===================================*/

    it(
      "clears all nonce state",
      () => {
        nonceManager.setNonce({
          sender:
            senderA,

          nonce: 1,

          updatedAt: 1,
        });

        nonceManager.setNonce({
          sender:
            senderB,

          nonce: 2,

          updatedAt: 2,
        });

        expect(
          nonceManager.size(),
        ).toBe(2);

        nonceManager.clear();

        expect(
          nonceManager.size(),
        ).toBe(0);

        expect(
          nonceManager.getNonce(
            senderA,
          ),
        ).toBe(0);

        expect(
          nonceManager.getNonce(
            senderB,
          ),
        ).toBe(0);
      },
    );
  },
);