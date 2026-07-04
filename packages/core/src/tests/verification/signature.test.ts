import {
  describe,
  expect,
  it,
} from "vitest";

import {
  makeEnvelope,
} from "../utils/makeEnvelope.js";

import {
  createIdentity,
} from "../../crypto/identity.js";

import {
  createSigningPayload,
  createSigningDigest,
  verifyEnvelopeSignature,
  SignatureVerificationError,
} from "../../verification/signature.js";

import {
  signEnvelope,
} from "../../crypto/signatures.js";

/* =========================================
 * HELPERS
 * =======================================*/

function signTestEnvelope() {
  const identity =
    createIdentity();

  const envelope =
    makeEnvelope();

  envelope.header.sender =
    identity.address;

  envelope.header.publicKey =
    identity.publicKey;

  envelope.signature =
    signEnvelope(
      createSigningPayload(
        envelope,
      ),
      identity.privateKey,
    );

  return {
    identity,
    envelope,
  };
}

/* =========================================
 * HAPPY PATH
 * =======================================*/

describe(
  "verification/signature (happy path)",
  () => {
    it(
      "should verify valid signed envelope",
      () => {
        const {
          envelope,
        } =
          signTestEnvelope();

        const result =
          verifyEnvelopeSignature(
            envelope,
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          result.error,
        ).toBeUndefined();

        expect(
          result.digest,
        ).toBeDefined();
      },
    );
  },
);

/* =========================================
 * MALFORMED INPUT
 * =======================================*/

describe(
  "verification/signature (malformed input)",
  () => {
    it(
      "should reject missing signature",
      () => {
        const {
          envelope,
        } =
          signTestEnvelope();

        envelope.signature =
          "" as any;

        const result =
          verifyEnvelopeSignature(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          SignatureVerificationError.SIGNATURE_MISSING,
        );
      },
    );

    it(
      "should reject malformed envelope",
      () => {
        const result =
          verifyEnvelopeSignature(
            null as any,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          SignatureVerificationError.MALFORMED_ENVELOPE,
        );
      },
    );

    it(
      "should reject invalid signature bytes",
      () => {
        const {
          envelope,
        } =
          signTestEnvelope();

        envelope.signature =
          (
            "0x" +
            "ff".repeat(64)
          ) as any;

        const result =
          verifyEnvelopeSignature(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          SignatureVerificationError.INVALID_SIGNATURE,
        );
      },
    );
  },
);

/* =========================================
 * INTEGRITY PROTECTION
 * =======================================*/

describe(
  "verification/signature (integrity)",
  () => {
    it(
      "should reject modified payload after signing",
      () => {
        const {
          envelope,
        } =
          signTestEnvelope();

        envelope.payload = {
          ...envelope.payload,

          amount: 999999,
        };

        const result =
          verifyEnvelopeSignature(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          SignatureVerificationError.INVALID_SIGNATURE,
        );
      },
    );

    it(
      "should reject modified header after signing",
      () => {
        const {
          envelope,
        } =
          signTestEnvelope();

        envelope.header.nonce += 1;

        const result =
          verifyEnvelopeSignature(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error,
        ).toBe(
          SignatureVerificationError.INVALID_SIGNATURE,
        );
      },
    );

    it(
      "should reject modified sender identity",
      () => {
        const {
          envelope,
        } =
          signTestEnvelope();

        envelope.header.sender =
          "0x1111111111111111111111111111111111111111";

        const result =
          verifyEnvelopeSignature(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);

        /**
         * Sender exists
         * inside signed payload.
         *
         * Therefore changing sender
         * invalidates signature first.
         */
        expect(
          result.error,
        ).toBe(
          SignatureVerificationError.INVALID_SIGNATURE,
        );
      },
    );
  },
);

/* =========================================
 * CANONICALIZATION
 * =======================================*/

describe(
  "verification/signature (canonicalization)",
  () => {
    it(
      "should produce identical digest for reordered keys",
      () => {
        const identity =
          createIdentity();
    
        /**
         * Base envelope.
         */
        const base =
          makeEnvelope();
    
        base.header.sender =
          identity.address;
    
        /**
         * Clone SAME envelope.
         */
        const envelopeA =
          structuredClone(base);
    
        const envelopeB =
          structuredClone(base);
    
        /**
         * Same logical payload.
         * Different key order.
         */
        envelopeA.payload = {
          a: 1,
          b: 2,
        };
    
        envelopeB.payload = {
          b: 2,
          a: 1,
        };
    
        const digestA =
          createSigningDigest(
            envelopeA,
          );
    
        const digestB =
          createSigningDigest(
            envelopeB,
          );
    
        expect(
          digestA,
        ).toBe(
          digestB,
        );
      },
    );

    it(
      "should verify reordered payload keys",
      () => {
        const identity =
          createIdentity();
    
        const baseEnvelope =
          makeEnvelope();
    
        /**
         * IMPORTANT:
         * sender + publicKey
         * must BOTH exist.
         */
        baseEnvelope.header.sender =
          identity.address;
    
        baseEnvelope.header.publicKey =
          identity.publicKey;
    
        /**
         * Clone identical envelope.
         */
        const envelopeA =
          structuredClone(
            baseEnvelope,
          );
    
        const envelopeB =
          structuredClone(
            baseEnvelope,
          );
    
        /**
         * Same logical payload.
         * Different key order.
         */
        envelopeA.payload = {
          amount: 100,
          asset: "USDC",
        };
    
        envelopeB.payload = {
          asset: "USDC",
          amount: 100,
        };
    
        /**
         * Independent signatures.
         */
        envelopeA.signature =
          signEnvelope(
            envelopeA,
            identity.privateKey,
          );
    
        envelopeB.signature =
          signEnvelope(
            envelopeB,
            identity.privateKey,
          );
    
        const resultA =
          verifyEnvelopeSignature(
            envelopeA,
          );
    
        const resultB =
          verifyEnvelopeSignature(
            envelopeB,
          );
    
        expect(
          resultA.success,
        ).toBe(true);
    
        expect(
          resultB.success,
        ).toBe(true);
    
        /**
         * Canonicalization guarantee.
         */
        expect(
          resultA.digest,
        ).toBe(
          resultB.digest,
        );
      },
    );
  },
);

/* =========================================
 * DETERMINISTIC GUARANTEES
 * =======================================*/

describe(
  "verification/signature (determinism)",
  () => {
    it(
      "should exclude metadata from signing payload",
      () => {
        const envelope =
          makeEnvelope();

        const payload =
          createSigningPayload(
            envelope,
          );

        expect(
          payload,
        ).not.toHaveProperty(
          "metadata",
        );
      },
    );

    it(
      "should exclude signature from signing payload",
      () => {
        const envelope =
          makeEnvelope();

        const payload =
          createSigningPayload(
            envelope,
          );

        expect(
          payload,
        ).not.toHaveProperty(
          "signature",
        );
      },
    );

    it(
      "should ignore metadata changes in verification",
      () => {
        const {
          envelope,
          identity,
        } =
          signTestEnvelope();

        envelope.metadata = {
          traceId:
            "trace-1",
        };

        envelope.signature =
          signEnvelope(
            createSigningPayload(
              envelope,
            ),
            identity.privateKey,
          );

        const modified = {
          ...envelope,

          metadata: {
            traceId:
              "trace-999",
          },
        };

        const result =
          verifyEnvelopeSignature(
            modified,
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "should produce deterministic digest across runs",
      () => {
        const {
          envelope,
        } =
          signTestEnvelope();

        const d1 =
          createSigningDigest(
            envelope,
          );

        const d2 =
          createSigningDigest(
            envelope,
          );

        const d3 =
          createSigningDigest(
            envelope,
          );

        expect(d1).toBe(d2);

        expect(d2).toBe(d3);
      },
    );
  },
);