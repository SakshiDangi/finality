import {
  describe,
  expect,
  it,
} from "vitest";

import type { Envelope } from "../../base/envelope.js";

import {
  verifyNonce,
  NonceVerificationError,
} from "../../verification/nonce.js";

/* =========================================
 * TEST HELPER
 * =======================================*/

function makeEnvelope(nonce: number): Envelope {
  return {
    header: {
      messageId: "msg-1",
      domain: "FINALITY_CORE_V1",
      messageKind: "REQUEST",
      sender: "0x1111111111111111111111111111111111111111",
      publicKey: ("0x" + "11".repeat(33)) as `0x${string}`,
      timestamp: 1_000_000,
      nonce,
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
  };
}

/* =========================================
 * VALID CASE
 * =======================================*/

describe("verifyNonce - valid cases", () => {
  it("accepts correct sequential nonce", () => {
    const result = verifyNonce(makeEnvelope(45), 44);

    expect(result.success).toBe(true);
    expect(result.receivedNonce).toBe(45);
    expect(result.latestNonce).toBe(44);
  });
});

/* =========================================
 * REPLAY ATTACK
 * =======================================*/

describe("verifyNonce - replay protection", () => {
  it("rejects duplicate nonce", () => {
    const result = verifyNonce(makeEnvelope(44), 44);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.NONCE_REPLAY,
    );
  });
});

/* =========================================
 * STALE NONCE
 * =======================================*/

describe("verifyNonce - ordering rules", () => {
  it("rejects stale nonce (older than latest)", () => {
    const result = verifyNonce(makeEnvelope(10), 44);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.NONCE_OUT_OF_ORDER,
    );
  });
});

/* =========================================
 * INVALID NONCE TYPES
 * =======================================*/

describe("verifyNonce - invalid inputs", () => {
  it("rejects negative nonce", () => {
    const result = verifyNonce(makeEnvelope(-1), 44);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.INVALID_NONCE,
    );
  });

  it("rejects float nonce", () => {
    const envelope = makeEnvelope(44.5);

    const result = verifyNonce(envelope, 44);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.INVALID_NONCE,
    );
  });

  it("rejects NaN nonce", () => {
    const envelope = {
      ...makeEnvelope(NaN),
    };

    const result = verifyNonce(envelope, 44);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.INVALID_NONCE,
    );
  });
});

/* =========================================
 * OVERFLOW SAFETY
 * =======================================*/

describe("verifyNonce - overflow handling", () => {
  it("rejects extremely large nonce", () => {
    const result = verifyNonce(
      makeEnvelope(Number.MAX_SAFE_INTEGER + 100),
      44,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.NONCE_OVERFLOW,
    );
  });
});

/* =========================================
 * EDGE CASES
 * =======================================*/

describe("verifyNonce - edge stability", () => {
  it("handles zero nonce correctly", () => {
    const result = verifyNonce(makeEnvelope(0), 0);

    expect(result.success).toBe(false); // replay rule
    expect(result.error).toBe(
      NonceVerificationError.NONCE_REPLAY,
    );
  });

  it("remains deterministic across repeated calls", () => {
    const env = makeEnvelope(50);

    const r1 = verifyNonce(env, 44);
    const r2 = verifyNonce(env, 44);

    expect(r1).toEqual(r2);
  });
});


// out-of-sync / same nonce edge case
describe("verifyNonce - state mismatch edge cases", () => {
  it("rejects duplicate nonce even when state is consistent", () => {
    const result = verifyNonce(makeEnvelope(100), 100);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.NONCE_REPLAY,
    );
  });

  it("rejects stale nonce even when only slightly behind", () => {
    const result = verifyNonce(makeEnvelope(99), 100);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.NONCE_OUT_OF_ORDER,
    );
  });
});


// monotonic sequence stability
describe("verifyNonce - monotonic sequence stability", () => {
  it("accepts strict increasing sequence", () => {
    let latest = 44;

    for (let i = 45; i <= 50; i++) {
      const result = verifyNonce(makeEnvelope(i), latest);

      expect(result.success).toBe(true);

      latest = i;
    }
  });
});

// boundary fuzzing around MAX_SAFE_INTEGER
describe("verifyNonce - boundary fuzzing", () => {
  it("handles MAX_SAFE_INTEGER boundary correctly", () => {
    const max = Number.MAX_SAFE_INTEGER;

    const ok = verifyNonce(makeEnvelope(max), max - 1);

    expect(ok.success).toBe(true);
  });

  it("rejects MAX_SAFE_INTEGER + 1 as overflow or invalid", () => {
    const result = verifyNonce(
      makeEnvelope(Number.MAX_SAFE_INTEGER + 1),
      44,
    );

    expect(result.success).toBe(false);

    // depending on implementation, either is acceptable
    expect([
      NonceVerificationError.NONCE_OVERFLOW,
      NonceVerificationError.INVALID_NONCE,
    ]).toContain(result.error);
  });
});

// type pollution/ malformed input resilience
describe("verifyNonce - malformed inputs resilience", () => {
  it("rejects string nonce via runtime coercion attack", () => {
    const env = makeEnvelope(44) as any;
    env.header.nonce = "44";

    const result = verifyNonce(env, 43);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.INVALID_NONCE,
    );
  });

  it("rejects null nonce safely", () => {
    const env = makeEnvelope(44) as any;
    env.header.nonce = null;

    const result = verifyNonce(env, 43);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.INVALID_NONCE,
    );
  });
});

// attack pattern simulation (rollback attack)
describe("verifyNonce - rollback attack simulation", () => {
  it("rejects nonce rollback sequence", () => {
    let latest = 43;

    // 44 → valid
    let r1 = verifyNonce(makeEnvelope(44), latest);
    expect(r1.success).toBe(true);
    latest = 44;

    // 45 → valid
    let r2 = verifyNonce(makeEnvelope(45), latest);
    expect(r2.success).toBe(true);
    latest = 45;

    // 44 → rollback → should FAIL
    let r3 = verifyNonce(makeEnvelope(44), latest);
    expect(r3.success).toBe(false);
    expect(r3.error).toBe(
      NonceVerificationError.NONCE_OUT_OF_ORDER,
    );

    // 46 → valid
    let r4 = verifyNonce(makeEnvelope(46), latest);
    expect(r4.success).toBe(true);
  });
});


// zero boundary correctness
describe("verifyNonce - zero boundary behavior", () => {
  it("rejects zero when already used", () => {
    const result = verifyNonce(makeEnvelope(0), 0);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      NonceVerificationError.NONCE_REPLAY,
    );
  });

  it("accepts zero as first-ever nonce", () => {
    const result = verifyNonce(makeEnvelope(0), -1);

    expect(result.success).toBe(true);
  });
});