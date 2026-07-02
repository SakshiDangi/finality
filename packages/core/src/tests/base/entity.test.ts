import { describe, expect, it } from "vitest";

import {
  BaseEntitySchema
} from "../../base/entity.js";

describe("base/entity", () => {
  it("should validate base entity", () => {
    const result =
      BaseEntitySchema.safeParse({
        id: "validator-1",
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          region: "asia"
        }
      });

    expect(result.success).toBe(true);
  });

  it("should apply default metadata", () => {
    const result =
      BaseEntitySchema.safeParse({
        id: "validator-1",
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.metadata)
        .toEqual({});
    }
  });

  it("should reject missing id", () => {
    const result =
      BaseEntitySchema.safeParse({
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

    expect(result.success).toBe(false);
  });

  it("should reject invalid version", () => {
    const result =
      BaseEntitySchema.safeParse({
        id: "validator-1",
        version: "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

    expect(result.success).toBe(false);
  });

  it("should reject negative timestamps", () => {
    const result =
      BaseEntitySchema.safeParse({
        id: "validator-1",
        version: "1.0.0",
        createdAt: -1,
        updatedAt: -1
      });

    expect(result.success).toBe(false);
  });
});