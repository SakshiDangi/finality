import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EnvelopeSchema,
} from "../../base/envelope.js";

const validHeader = {
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

const validSignature =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("base/envelope", () => {
  it(
    "should validate envelope",
    () => {
      const result =
        EnvelopeSchema.safeParse({
          header:
            validHeader,

          payload: {
            amount: 100,
            asset: "USDC",
          },

          signature:
            validSignature,

          metadata: {
            traceId:
              "trace-1",

            relayId:
              "relay-1",
          },
        });

      if (!result.success) {
        console.log(
          result.error.format(),
        );
      }

      expect(result.success)
        .toBe(true);
    },
  );

  it(
    "should validate envelope without metadata",
    () => {
      const result =
        EnvelopeSchema.safeParse({
          header:
            validHeader,

          payload: {
            hello: "world",
          },

          signature:
            validSignature,
        });

      if (!result.success) {
        console.log(
          result.error.format(),
        );
      }

      expect(result.success)
        .toBe(true);
    },
  );

  it(
    "should reject invalid signature",
    () => {
      const result =
        EnvelopeSchema.safeParse({
          header:
            validHeader,

          payload: {},

          signature:
            "invalid-signature",
        });

      expect(result.success)
        .toBe(false);
    },
  );

  it(
    "should reject missing header",
    () => {
      const result =
        EnvelopeSchema.safeParse({
          payload: {},

          signature:
            validSignature,
        });

      expect(result.success)
        .toBe(false);
    },
  );

  it(
    "should reject invalid payload",
    () => {
      const result =
        EnvelopeSchema.safeParse({
          header:
            validHeader,

          payload: null,

          signature:
            validSignature,
        });

      expect(result.success)
        .toBe(false);
    },
  );

  it(
    "should reject invalid metadata",
    () => {
      const result =
        EnvelopeSchema.safeParse({
          header:
            validHeader,

          payload: {},

          signature:
            validSignature,

          metadata:
            "invalid",
        });

      expect(result.success)
        .toBe(false);
    },
  );
});