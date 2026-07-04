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
  executeVerificationPipeline,
  PipelineStage,
} from "../../verification/pipeline.js";

/* =========================================
 * HELPERS
 * =======================================*/

function makeSignedEnvelope(
  overrides: Partial<any> = {},
) {
  const identity =
    createIdentity();

  const envelope =
    makeEnvelope();

  envelope.header.sender =
    identity.address;

  envelope.header.publicKey =
    identity.publicKey;

  Object.assign(
    envelope.header,
    overrides.header ?? {},
  );

  Object.assign(
    envelope.payload,
    overrides.payload ?? {},
  );

  envelope.signature =
    signEnvelope(
      createSigningPayload(
        envelope,
      ),
      identity.privateKey,
    );

  return {
    envelope,
    identity,
  };
}

/* =========================================
 * HAPPY PATH
 * =======================================*/

describe(
  "pipeline (happy path)",
  () => {
    it(
      "should route valid envelope to VERIFIED",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope();

        const result =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce:
                  envelope.header.nonce - 1,
              },
            },
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          result.stage,
        ).toBe(
          PipelineStage.VERIFIED,
        );
      },
    );
  },
);

/* =========================================
 * SIGNATURE FAILURES
 * =======================================*/

describe(
  "pipeline (signature failures)",
  () => {
    it(
      "should reject malformed signature",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope();

        envelope.signature =
          "0xdeadbeef" as any;

        const result =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce: 0,
              },
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          PipelineStage.REJECTED,
        );
      },
    );

    it(
      "should reject payload tampering",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope();

        envelope.payload.amount =
          999999;

        const result =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce: 0,
              },
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          PipelineStage.REJECTED,
        );
      },
    );

    it(
      "should reject header tampering",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope();

        envelope.header.domain =
          "evil-domain";

        const result =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce: 0,
              },
            },
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);

/* =========================================
 * TIMESTAMP SECURITY
 * =======================================*/

describe(
  "pipeline (timestamp security)",
  () => {
    it(
      "should reject expired envelope",
      () => {
        const past =
          Date.now() -
          1000 * 60 * 60;

        const {
          envelope,
          identity,
        } = makeSignedEnvelope({
          header: {
            timestamp: past,
          },
        });

        const result =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce: 0,
              },
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          PipelineStage.REJECTED,
        );
      },
    );
  },
);

/* =========================================
 * NONCE SECURITY
 * =======================================*/

describe(
  "pipeline (nonce security)",
  () => {
    it(
      "should reject replayed nonce",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope({
          header: {
            nonce: 1,
          },
        });

        const result =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce: 1,
              },
            },
          );

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.stage,
        ).toBe(
          PipelineStage.REJECTED,
        );
      },
    );

    it(
      "should accept fresh nonce",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope({
          header: {
            nonce: 10,
          },
        });

        const result =
          executeVerificationPipeline(
            envelope,
            {
              verifier: {
                publicKey:
                  identity.publicKey,

                currentTime:
                  Date.now(),

                latestNonce: 9,
              },
            },
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );
  },
);

/* =========================================
 * DETERMINISM
 * =======================================*/

describe(
  "pipeline (determinism)",
  () => {
    it(
      "should produce identical results for same input",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope();

        const context = {
          verifier: {
            publicKey:
              identity.publicKey,

            currentTime:
              1234567890,

            latestNonce: 0,
          },
        };

        const resultA =
          executeVerificationPipeline(
            envelope,
            context,
          );

        const resultB =
          executeVerificationPipeline(
            envelope,
            context,
          );

        expect(
          resultA,
        ).toEqual(
          resultB,
        );
      },
    );
  },
);

/* =========================================
 * IMMUTABILITY
 * =======================================*/

describe(
  "pipeline (immutability)",
  () => {
    it(
      "should not mutate envelope",
      () => {
        const {
          envelope,
          identity,
        } = makeSignedEnvelope();

        const snapshot =
          JSON.stringify(
            envelope,
          );

        executeVerificationPipeline(
          envelope,
          {
            verifier: {
              publicKey:
                identity.publicKey,

              currentTime:
                Date.now(),

              latestNonce: 0,
            },
          },
        );

        expect(
          JSON.stringify(
            envelope,
          ),
        ).toBe(snapshot);
      },
    );
  },
);