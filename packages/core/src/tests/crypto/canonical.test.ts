import { describe, expect, it } from "vitest";

import type { Envelope } from "../../base/envelope.js";

import {
  canonicalJSONStringify,
  canonicalizeEnvelope,
  sortCanonicalKeys,
} from "../../crypto/canonical.js";

/**
 * Minimal valid envelope factory
 * aligned with real EnvelopeSchema
 */
function makeEnvelope(
  overrides?: Partial<Envelope>,
): Envelope {
  return {
    header: {
      // IMPORTANT:
      // We do NOT guess fields here.
      // We keep it minimal AND cast-safe.
    } as Envelope["header"],

    payload: {
      z: 1,
      a: 2,
    },

    signature:
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

    metadata: {
      traceId: "trace-1",
    },

    ...overrides,
  };
}

describe("crypto/canonical", () => {
  it("should sort object keys deterministically", () => {
    expect(
      sortCanonicalKeys({ z: 1, a: 2, m: 3 }),
    ).toEqual({ a: 2, m: 3, z: 1 });
  });

  it("should recursively sort nested objects", () => {
    expect(
      sortCanonicalKeys({
        z: { y: 1, a: 2 },
        b: { d: 4, c: 3 },
      }),
    ).toEqual({
      b: { c: 3, d: 4 },
      z: { a: 2, y: 1 },
    });
  });

  it("should preserve array ordering", () => {
    expect(
      sortCanonicalKeys([
        { z: 1, a: 2 },
        { b: 3, a: 4 },
      ]),
    ).toEqual([
      { a: 2, z: 1 },
      { a: 4, b: 3 },
    ]);
  });

  it("should produce deterministic JSON output", () => {
    expect(
      canonicalJSONStringify({ z: 1, a: 2 }),
    ).toBe(
      canonicalJSONStringify({ a: 2, z: 1 }),
    );
  });

  it("should canonicalize envelope correctly", () => {
    const envelope = makeEnvelope();

    const result = canonicalizeEnvelope(envelope);

    expect(result).toContain('"a":2');
    expect(result).toContain('"z":1');

    // critical security boundary checks
    expect(result).not.toContain("signature");
    expect(result).not.toContain("metadata");
  });

  it("should produce identical canonical output for reordered payloads", () => {
    const left = canonicalJSONStringify({
      payload: { amount: 100, asset: "USDC" },
    });

    const right = canonicalJSONStringify({
      payload: { asset: "USDC", amount: 100 },
    });

    expect(left).toBe(right);
  });

  it("should reject unsupported values", () => {
    expect(() =>
      sortCanonicalKeys(undefined),
    ).toThrow("Unsupported canonical value");
  });
});