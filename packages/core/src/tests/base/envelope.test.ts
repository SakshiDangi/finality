import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EnvelopeSchema,
} from "../../base/envelope.js";

import type {
  Envelope,
  EnvelopeMetadata,
  EnvelopePayload,
} from "../../base/envelope.js";

/* =========================================
 * TEST HELPERS
 * =======================================*/

function makeHeader():
  Envelope["header"] {
  return {
    messageId:
      "msg-1",

    domain:
      "FINALITY_CORE_V1",

    protocol:
      "FINALITY",

    version:
      "1.0.0",

    messageKind:
      "REQUEST",

    sender:
      "0x1111111111111111111111111111111111111111",

    publicKey:
      "0x" + "11".repeat(33),

    timestamp:
      Date.now(),

    nonce: 1,

    sequence: 0,

    ttl: 30000,

    signatureAlgorithm:
      "SECP256K1",

    priority:
      "NORMAL",
  };
}

function makePayload():
  EnvelopePayload {
  return {
    amount: 100,
    asset: "USDC",
  };
}

function makeMetadata():
  EnvelopeMetadata {
  return {
    traceId:
      "trace-1",
  };
}

function makeEnvelope():
  Envelope {
  return {
    header:
      makeHeader(),

    payload:
      makePayload(),

    signature:
      ("0x" +
        "aa".repeat(
          64,
        )) as `0x${string}`,

    metadata:
      makeMetadata(),
  };
}

/* =========================================
 * VALID ENVELOPES
 * =======================================*/

describe(
  "base/envelope (valid envelopes)",
  () => {
    it(
      "should validate canonical envelope",
      () => {
        const result =
          EnvelopeSchema.safeParse(
            makeEnvelope(),
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "should validate envelope without metadata",
      () => {
        const {
          metadata,
          ...envelope
        } = makeEnvelope();

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "should allow nested payload values",
      () => {
        const envelope: Envelope =
          {
            ...makeEnvelope(),

            payload: {
              nested: {
                amount: 100,
              },

              assets: [
                "USDC",
                "ETH",
              ],
            },
          };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );
  },
);

/* =========================================
 * SIGNATURE VALIDATION
 * =======================================*/

describe(
  "base/envelope (signature validation)",
  () => {
    it(
      "should reject invalid signature format",
      () => {
        const envelope: Envelope =
          {
            ...makeEnvelope(),

            signature:
              "invalid" as any,
          };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "should reject missing signature",
      () => {
        const envelope =
          makeEnvelope();

        delete (
          envelope as any
        ).signature;

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);

/* =========================================
 * HEADER VALIDATION
 * =======================================*/

describe(
  "base/envelope (header validation)",
  () => {
    it(
      "should reject missing header",
      () => {
        const envelope =
          makeEnvelope();

        delete (
          envelope as any
        ).header;

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "should reject malformed sender address",
      () => {
        const envelope: Envelope =
          {
            ...makeEnvelope(),

            header: {
              ...makeHeader(),

              sender:
                "invalid",
            },
          };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "should reject unknown envelope fields",
      () => {
        const envelope = {
          ...makeEnvelope(),

          hacked: true,
        };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);

/* =========================================
 * PAYLOAD VALIDATION
 * =======================================*/

describe(
  "base/envelope (payload validation)",
  () => {
    it(
      "should reject null payload",
      () => {
        const envelope: Envelope =
          {
            ...makeEnvelope(),

            payload:
              null as any,
          };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "should reject invalid payload type",
      () => {
        const envelope: Envelope =
          {
            ...makeEnvelope(),

            payload:
              "invalid" as any,
          };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);

/* =========================================
 * METADATA VALIDATION
 * =======================================*/

describe(
  "base/envelope (metadata validation)",
  () => {
    it(
      "should allow arbitrary metadata",
      () => {
        const envelope: Envelope =
          {
            ...makeEnvelope(),

            metadata: {
              traceId:
                "trace-1",

              relay:
                "relay-7",

              diagnostics: {
                latency: 22,
              },
            },
          };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "should reject invalid metadata type",
      () => {
        const envelope: Envelope =
          {
            ...makeEnvelope(),

            metadata:
              "invalid" as any,
          };

        const result =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);