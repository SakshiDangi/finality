import {
  describe,
  expect,
  it,
} from "vitest";

import type { Envelope } from "../../base/envelope.js";

import {
  verifyTimestamp,
  TimestampVerificationError,
  DEFAULT_TIMESTAMP_OPTIONS,
} from "../../verification/timestamp.js";

/* =========================================
 * TEST HELPERS
 * =======================================*/

function makeEnvelope(
  overrides?: Partial<Envelope["header"]>,
): Envelope {
  return {
    header: {
      messageId: "msg-1",
      domain: "FINALITY_CORE_V1",
      messageKind: "REQUEST",
      sender: "0x1111111111111111111111111111111111111111",
      publicKey: ("0x" + "11".repeat(33)) as `0x${string}`,
      timestamp: 1_000_000,
      nonce: 1,
      sequence: 1,
      ttl: 30_000,
      signatureAlgorithm: "SECP256K1",
      priority: "NORMAL",
      protocol: "FINALITY",
      version: "1.0.0",
      ...overrides,
    },
    payload: {},
    signature:
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    metadata: {},
  };
}

/* =========================================
 * VALID TIMESTAMP
 * =======================================*/

describe("verifyTimestamp - valid cases", () => {
  it("accepts valid timestamp within TTL window", () => {
    const now = 1_005_000;

    const envelope = makeEnvelope({
      timestamp: 1_000_000,
      ttl: 30_000,
    });

    const result = verifyTimestamp(envelope, now);

    expect(result.success).toBe(true);
    expect(result.ageMs).toBe(5_000);
    expect(result.expiresAt).toBe(1_030_000);
  });

  it("accepts boundary condition: exactly at expiration boundary", () => {
    const envelope = makeEnvelope({
      timestamp: 1_000_000,
      ttl: 30_000,
    });

    const now = 1_030_000;

    const result = verifyTimestamp(envelope, now);

    expect(result.success).toBe(true);
    expect(result.expiresAt).toBe(1_030_000);
  });
});

/* =========================================
 * EXPIRED REQUEST
 * =======================================*/

describe("verifyTimestamp - expiration", () => {
  it("rejects expired envelope", () => {
    const envelope = makeEnvelope({
      timestamp: 1_000_000,
      ttl: 10_000,
    });

    const now = 1_020_000; // past expiry

    const result = verifyTimestamp(envelope, now);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      TimestampVerificationError.MESSAGE_EXPIRED,
    );
    expect(result.ageMs).toBe(20_000);
    expect(result.expiresAt).toBe(1_010_000);
  });
});

/* =========================================
 * FUTURE TIMESTAMP
 * =======================================*/

describe("verifyTimestamp - future drift", () => {
  it("rejects timestamp too far in the future", () => {
    const now = 1_000_000;

    const envelope = makeEnvelope({
      timestamp: 1_100_000, // +100k ms future
      ttl: 30_000,
    });

    const result = verifyTimestamp(envelope, now);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      TimestampVerificationError.FUTURE_TIMESTAMP,
    );
  });
});


// TTL boundary attack, invalid timestamp and fuzzing stability
describe("verifyTimestamp - TTL validation", () => {
  it("rejects TTL too small", () => {
    const envelope = {
      header: {
        messageId: "msg-1",
        domain: "FINALITY_CORE_V1",
        messageKind: "REQUEST",
        sender: "0x1111111111111111111111111111111111111111",
        timestamp: 1_000_000,
        nonce: 1,
        sequence: 1,
        ttl: 0, // invalid (below minTTL = 1000)
        signatureAlgorithm: "SECP256K1",
        priority: "NORMAL",
        protocol: "FINALITY",
        version: "1.0.0",
      },
      payload: {},
      signature:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      metadata: {},
    } as any;

    const result = verifyTimestamp(envelope, 1_000_000);

    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_TTL");
  });

  it("rejects TTL too large", () => {
    const envelope = {
      header: {
        messageId: "msg-1",
        domain: "FINALITY_CORE_V1",
        messageKind: "REQUEST",
        sender: "0x1111111111111111111111111111111111111111",
        timestamp: 1_000_000,
        nonce: 1,
        sequence: 1,
        ttl: 10 * 60 * 1000, // 10 minutes (exceeds maxTTL = 5 min)
        signatureAlgorithm: "SECP256K1",
        priority: "NORMAL",
        protocol: "FINALITY",
        version: "1.0.0",
      },
      payload: {},
      signature:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      metadata: {},
    } as any;

    const result = verifyTimestamp(envelope, 1_000_000);

    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_TTL");
  });
});


// clock skew, real world time drift
describe("verifyTimestamp - clock skew handling", () => {
  it("accepts small future drift within allowed bounds", () => {
    const now = 1_000_000;

    const envelope = {
      header: {
        messageId: "msg-1",
        domain: "FINALITY_CORE_V1",
        messageKind: "REQUEST",
        sender: "0x1111111111111111111111111111111111111111",
        timestamp: now + 10_000, // +10s drift
        nonce: 1,
        sequence: 1,
        ttl: 30_000,
        signatureAlgorithm: "SECP256K1",
        priority: "NORMAL",
        protocol: "FINALITY",
        version: "1.0.0",
      },
      payload: {},
      signature:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      metadata: {},
    } as any;

    const result = verifyTimestamp(envelope, now);

    expect(result.success).toBe(true);
  });
});

//  deterministic repeatability (protocol invariant)
describe("verifyTimestamp - deterministic behavior", () => {
  it("returns identical results across repeated executions", () => {
    const envelope = {
      header: {
        messageId: "msg-1",
        domain: "FINALITY_CORE_V1",
        messageKind: "REQUEST",
        sender: "0x1111111111111111111111111111111111111111",
        timestamp: 1_000_000,
        nonce: 1,
        sequence: 1,
        ttl: 30_000,
        signatureAlgorithm: "SECP256K1",
        priority: "NORMAL",
        protocol: "FINALITY",
        version: "1.0.0",
      },
      payload: {},
      signature:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      metadata: {},
    } as any;

    const now = 1_005_000;

    const r1 = verifyTimestamp(envelope, now);
    const r2 = verifyTimestamp(envelope, now);
    const r3 = verifyTimestamp(envelope, now);

    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
  });
});

// envelope mutation resistance
describe("verifyTimestamp - mutation resistance", () => {
  it("does not depend on payload or metadata integrity", () => {
    const base = {
      header: {
        messageId: "msg-1",
        domain: "FINALITY_CORE_V1",
        messageKind: "REQUEST",
        sender: "0x1111111111111111111111111111111111111111",
        timestamp: 1_000_000,
        nonce: 1,
        sequence: 1,
        ttl: 30_000,
        signatureAlgorithm: "SECP256K1",
        priority: "NORMAL",
        protocol: "FINALITY",
        version: "1.0.0",
      },
      payload: {},
      signature:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      metadata: {},
    } as any;

    const mutated = {
      ...base,
      payload: { hacked: true },
      metadata: { trace: "altered" },
    };

    const now = 1_005_000;

    const r1 = verifyTimestamp(base, now);
    const r2 = verifyTimestamp(mutated, now);

    expect(r1.success).toBe(r2.success);
    expect(r1.error).toBe(r2.error);
  });
});

// stress consistency (multi-run)
describe("verifyTimestamp - stress stability", () => {
  it("remains stable across many executions", () => {
    const envelope = {
      header: {
        messageId: "msg-1",
        domain: "FINALITY_CORE_V1",
        messageKind: "REQUEST",
        sender: "0x1111111111111111111111111111111111111111",
        timestamp: 1_000_000,
        nonce: 1,
        sequence: 1,
        ttl: 30_000,
        signatureAlgorithm: "SECP256K1",
        priority: "NORMAL",
        protocol: "FINALITY",
        version: "1.0.0",
      },
      payload: {},
      signature:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      metadata: {},
    } as any;

    const now = 1_010_000;

    const results = Array.from({ length: 100 }, () =>
      verifyTimestamp(envelope, now),
    );

    for (const r of results) {
      expect(r.success).toBe(results[0].success);
      expect(r.error).toBe(results[0].error);
    }
  });
}); 