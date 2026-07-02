import { describe, expect, it } from "vitest";

import {
  HexStringSchema,
  IdentifierSchema,
  MetadataSchema,
  NonceSchema,
  TimestampSchema
} from "../../base/primitives.js";

describe("base/primitives", () => {
  it("should validate identifier", () => {
    const result =
      IdentifierSchema.safeParse(
        "validator-1"
      );

    expect(result.success).toBe(true);
  });

  it("should reject empty identifier", () => {
    const result =
      IdentifierSchema.safeParse("");

    expect(result.success).toBe(false);
  });

  it("should validate timestamp", () => {
    const result =
      TimestampSchema.safeParse(
        Date.now()
      );

    expect(result.success).toBe(true);
  });

  it("should reject negative timestamp", () => {
    const result =
      TimestampSchema.safeParse(-1);

    expect(result.success).toBe(false);
  });

  it("should validate nonce", () => {
    const result =
      NonceSchema.safeParse(100);

    expect(result.success).toBe(true);
  });

  it("should reject negative nonce", () => {
    const result =
      NonceSchema.safeParse(-10);

    expect(result.success).toBe(false);
  });

  it("should validate hex string", () => {
    const result =
      HexStringSchema.safeParse(
        "0xabcdef123"
      );

    expect(result.success).toBe(true);
  });

  it("should reject invalid hex string", () => {
    const result =
      HexStringSchema.safeParse(
        "invalid-hex"
      );

    expect(result.success).toBe(false);
  });

  it("should validate metadata", () => {
    const result =
      MetadataSchema.safeParse({
        region: "asia",
        validator: true
      });

    expect(result.success).toBe(true);
  });
});