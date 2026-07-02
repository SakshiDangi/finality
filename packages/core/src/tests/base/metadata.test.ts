import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CompressionSchema,
  MetadataSchema,
} from "../../base/metadata.js";

describe("base/metadata", () => {
  it("should validate metadata", () => {
    const result =
      MetadataSchema.safeParse({
        traceId:
          "trace-123",

        relayId:
          "relay-node-1",

        hopCount: 2,

        receivedAt:
          Date.now(),

        compression:
          "GZIP",

        region:
          "ap-south-1",
      });

    expect(result.success)
      .toBe(true);
  });

  it("should allow empty metadata", () => {
    const result =
      MetadataSchema.safeParse({});

    expect(result.success)
      .toBe(true);
  });

  it("should validate compression enum", () => {
    expect(
      CompressionSchema.parse(
        "BROTLI",
      ),
    ).toBe("BROTLI");
  });

  it("should reject invalid compression", () => {
    const result =
      CompressionSchema.safeParse(
        "ZIP",
      );

    expect(result.success)
      .toBe(false);
  });

  it("should reject negative hop count", () => {
    const result =
      MetadataSchema.safeParse({
        hopCount: -1,
      });

    expect(result.success)
      .toBe(false);
  });

  it("should reject invalid receivedAt", () => {
    const result =
      MetadataSchema.safeParse({
        receivedAt: -100,
      });

    expect(result.success)
      .toBe(false);
  });

  it("should reject oversized region", () => {
    const result =
      MetadataSchema.safeParse({
        region:
          "x".repeat(100),
      });

    expect(result.success)
      .toBe(false);
  });
});