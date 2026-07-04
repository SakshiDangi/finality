import {
  describe,
  expect,
  it,
} from "vitest";

import {
  HeaderSchema,
} from "../../base/header.js";

describe("base/header", () => {
  it("should validate a valid header", () => {
    const result =
      HeaderSchema.safeParse({
        messageId: "msg-1",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          "0x1111111111111111111111111111111111111111",
        
        publicKey:
          "0x02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        
        timestamp:
          Date.now(),

        nonce: 1,

        sequence: 0,
      });

    expect(result.success)
      .toBe(true);
  });

  it("should apply schema defaults", () => {
    const result =
      HeaderSchema.safeParse({
        messageId: "msg-1",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          "0x1111111111111111111111111111111111111111",

        publicKey:
          "0x02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        timestamp:
          Date.now(),

        nonce: 1,

        sequence: 0,
      });

    expect(result.success)
      .toBe(true);

    if (result.success) {
      expect(result.data.ttl)
        .toBe(30_000);

      expect(
        result.data.priority,
      ).toBe("NORMAL");

      expect(
        result.data.protocol,
      ).toBe("FINALITY");

      expect(
        result.data.version,
      ).toBe("1.0.0");

      expect(
        result.data.signatureAlgorithm,
      ).toBe("SECP256K1");
    }
  });

  it("should reject invalid sender address", () => {
    const result =
      HeaderSchema.safeParse({
        messageId: "msg-1",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          "invalid-address",

        timestamp:
          Date.now(),

        nonce: 1,

        sequence: 0,
      });

    expect(result.success)
      .toBe(false);
  });

  it("should reject negative nonce", () => {
    const result =
      HeaderSchema.safeParse({
        messageId: "msg-1",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          "0x1111111111111111111111111111111111111111",

        publicKey:
          "0x02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        timestamp:
          Date.now(),

        nonce: -1,

        sequence: 0,
      });

    expect(result.success)
      .toBe(false);
  });

  it("should reject invalid ttl", () => {
    const result =
      HeaderSchema.safeParse({
        messageId: "msg-1",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          "0x1111111111111111111111111111111111111111",

        publicKey:
          "0x02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        timestamp:
          Date.now(),

        nonce: 1,

        sequence: 0,

        ttl: -100,
      });

    expect(result.success)
      .toBe(false);
  });

  it("should reject negative sequence", () => {
    const result =
      HeaderSchema.safeParse({
        messageId: "msg-1",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          "0x1111111111111111111111111111111111111111",

        timestamp:
          Date.now(),

        nonce: 1,

        sequence: -1,
      });

    expect(result.success)
      .toBe(false);
  });

  it("should reject empty message id", () => {
    const result =
      HeaderSchema.safeParse({
        messageId: "",

        domain:
          "FINALITY_CORE_V1",

        messageKind:
          "REQUEST",

        sender:
          "0x1111111111111111111111111111111111111111",

        timestamp:
          Date.now(),

        nonce: 1,

        sequence: 0,
      });

    expect(result.success)
      .toBe(false);
  });
});