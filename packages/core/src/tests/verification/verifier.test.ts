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
  signEnvelope,
} from "../../crypto/signatures.js";

import {
  createSigningPayload,
} from "../../verification/signature.js";

import {
  verifyEnvelope,
  VerificationStage,
} from "../../verification/verifier.js";

describe(
  "verification/verifier (happy path)",
  () => {
    it(
      "should fully verify valid envelope",
      () => {
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

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce:
                envelope.header.nonce - 1,
            },
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          result.stage,
        ).toBe(
          VerificationStage.COMPLETE,
        );
      },
    );
  },
);

describe(
  "verification/verifier (signature stage)",
  () => {
    it(
      "should fail on invalid signature",
      () => {
        const identity =
          createIdentity();

        const envelope =
          makeEnvelope();

        envelope.header.sender =
          identity.address;

        envelope.header.publicKey =
          identity.publicKey;

        envelope.signature =
          "0xdeadbeef" as any;

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce: 0,
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          VerificationStage.SIGNATURE,
        );
      },
    );

    it(
      "should fail when signature missing",
      () => {
        const identity =
          createIdentity();

        const envelope =
          makeEnvelope();

        envelope.header.sender =
          identity.address;

        envelope.header.publicKey =
          identity.publicKey;

        envelope.signature =
          "" as any;

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce: 0,
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          VerificationStage.SIGNATURE,
        );
      },
    );
  },
);

describe(
  "verification/verifier (timestamp stage)",
  () => {
    it(
      "should reject expired timestamp",
      () => {
        const identity =
          createIdentity();

        const envelope =
          makeEnvelope();

        envelope.header.sender =
          identity.address;

        envelope.header.publicKey =
          identity.publicKey;

        /**
         * Simulate old envelope.
         */
        envelope.header.timestamp =
          Date.now() - (
            1000 * 60 * 60 * 24
          );

        envelope.signature =
          signEnvelope(
            createSigningPayload(
              envelope,
            ),
            identity.privateKey,
          );

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce: 0,
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          VerificationStage.TIMESTAMP,
        );
      },
    );
  },
);

describe(
  "verification/verifier (nonce stage)",
  () => {
    it(
      "should reject replayed nonce",
      () => {
        const identity =
          createIdentity();

        const envelope =
          makeEnvelope();

        envelope.header.sender =
          identity.address;

        envelope.header.publicKey =
          identity.publicKey;

        envelope.header.nonce =
          5;

        envelope.signature =
          signEnvelope(
            createSigningPayload(
              envelope,
            ),
            identity.privateKey,
          );

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce:
                5,
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          VerificationStage.NONCE,
        );
      },
    );

    it(
      "should accept newer nonce",
      () => {
        const identity =
          createIdentity();

        const envelope =
          makeEnvelope();

        envelope.header.sender =
          identity.address;

        envelope.header.publicKey =
          identity.publicKey;

        envelope.header.nonce =
          10;

        envelope.signature =
          signEnvelope(
            createSigningPayload(
              envelope,
            ),
            identity.privateKey,
          );

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce:
                9,
            },
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          result.stage,
        ).toBe(
          VerificationStage.COMPLETE,
        );
      },
    );
  },
);

describe(
  "verification/verifier (pipeline guarantees)",
  () => {
    it(
      "should stop at signature stage before timestamp validation",
      () => {
        const identity =
          createIdentity();

        const envelope =
          makeEnvelope();

        envelope.header.sender =
          identity.address;

        envelope.header.publicKey =
          identity.publicKey;

        /**
         * Invalid signature.
         */
        envelope.signature =
          "0x00" as any;

        /**
         * Also invalid timestamp.
         * Signature stage must fail first.
         */
        envelope.header.timestamp =
          0;

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce:
                999,
            },
          );

        expect(
          result.stage,
        ).toBe(
          VerificationStage.SIGNATURE,
        );
      },
    );

    it(
      "should stop at timestamp stage before nonce validation",
      () => {
        const identity =
          createIdentity();

        const envelope =
          makeEnvelope();

        envelope.header.sender =
          identity.address;

        envelope.header.publicKey =
          identity.publicKey;

        envelope.header.timestamp =
          0;

        envelope.signature =
          signEnvelope(
            createSigningPayload(
              envelope,
            ),
            identity.privateKey,
          );

        const result =
          verifyEnvelope(
            envelope,
            {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce:
                999,
            },
          );

        expect(
          result.stage,
        ).toBe(
          VerificationStage.TIMESTAMP,
        );
      },
    );
  },
);