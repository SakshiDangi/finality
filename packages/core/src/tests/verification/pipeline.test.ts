import { describe, expect, it } from "vitest";

import { makeEnvelope } from "../utils/makeEnvelope.js";

import {
  executeVerificationPipeline,
  PipelineStage,
} from "../../verification/pipeline.js";

import {
  generateKeyPair,
  deriveAddress,
} from "../../crypto/identity.js";

import { signPayload } from "../../crypto/signatures.js";

/* =========================================================
 * HELPERS
 * =======================================================*/

function makeSignedEnvelope(overrides: any = {}, keyPair?: any) {
  const kp = keyPair ?? generateKeyPair();
  const sender = deriveAddress(kp.publicKey);

  const base = makeEnvelope();

  const envelope = {
    ...base,
    header: {
      ...base.header,
      sender,
      ttl: 10_000,
      ...overrides.header,
    },
    payload: {
      ...base.payload,
      ...overrides.payload,
    },
  };

  const signature = signPayload(
    { header: envelope.header, payload: envelope.payload },
    kp.privateKey,
  );

  return { envelope: { ...envelope, signature }, keyPair: kp };
}

/* =========================================================
 * BASIC CORRECTNESS
 * =======================================================*/

describe("pipeline - correctness", () => {
  it("routes valid envelope to VERIFIED stage", () => {
    const { envelope, keyPair } = makeSignedEnvelope();

    const result = executeVerificationPipeline(envelope, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: Date.now(),
        latestNonce: 0,
      },
    });

    expect(result.success).toBe(true);
    expect(result.stage).toBe(PipelineStage.VERIFIED);
  });

  it("routes invalid envelope to REJECTED stage", () => {
    const envelope = makeEnvelope({
      signature: "0xdeadbeef" as any,
    });

    const result = executeVerificationPipeline(envelope, {
      verifier: {
        publicKey: "0xinvalid" as any,
        currentTime: Date.now(),
        latestNonce: 0,
      },
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe(PipelineStage.REJECTED);
  });
});

/* =========================================================
 * TIMESTAMP ATTACKS
 * =======================================================*/

describe("pipeline - timestamp security", () => {
  it("rejects expired envelope", () => {
    const { envelope, keyPair } = makeSignedEnvelope({
      header: { timestamp: 1000, ttl: 1000 },
    });

    const result = executeVerificationPipeline(envelope, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: 1_000_000,
        latestNonce: 0,
      },
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe(PipelineStage.REJECTED);
  });

  it("accepts boundary-valid timestamp (edge case)", () => {
    const { envelope, keyPair } = makeSignedEnvelope({
      header: { timestamp: Date.now(), ttl: 5000 },
    });

    const result = executeVerificationPipeline(envelope, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: envelope.header.timestamp + 4999,
        latestNonce: 0,
      },
    });

    expect(result.success).toBe(true);
  });
});

/* =========================================================
 * REPLAY ATTACKS
 * =======================================================*/

describe("pipeline - replay protection", () => {
  it("rejects reused signature with modified nonce", () => {
    const { envelope, keyPair } = makeSignedEnvelope({
      header: { nonce: 1 },
    });

    const original = executeVerificationPipeline(envelope, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: Date.now(),
        latestNonce: 0,
      },
    });

    const replay = {
      ...envelope,
      header: {
        ...envelope.header,
        nonce: 2, // tampered after signing
      },
    };

    const result = executeVerificationPipeline(replay, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: Date.now(),
        latestNonce: 1,
      },
    });

    expect(original.success).toBe(true);
    expect(result.success).toBe(false);
    expect(result.stage).toBe(PipelineStage.REJECTED);
  });

  it("rejects nonce regression (rollback)", () => {
    const { envelope, keyPair } = makeSignedEnvelope({
      header: { nonce: 5 },
    });

    const result = executeVerificationPipeline(envelope, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: Date.now(),
        latestNonce: 10, // rollback
      },
    });

    expect(result.success).toBe(false);
  });
});

/* =========================================================
 * MUTATION ATTACKS
 * =======================================================*/

describe("pipeline - mutation safety", () => {
  it("rejects payload modification after signing", () => {
    const { envelope, keyPair } = makeSignedEnvelope();

    const tampered = {
      ...envelope,
      payload: {
        amount: 999999,
        asset: "USDC",
      },
    };

    const result = executeVerificationPipeline(tampered, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: Date.now(),
        latestNonce: 0,
      },
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe(PipelineStage.REJECTED);
  });

  it("rejects domain tampering after signing", () => {
    const { envelope, keyPair } = makeSignedEnvelope({
      header: { domain: "A" },
    });

    const tampered = {
      ...envelope,
      header: {
        ...envelope.header,
        domain: "B",
      },
    };

    const result = executeVerificationPipeline(tampered, {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: Date.now(),
        latestNonce: 0,
      },
    });

    expect(result.success).toBe(false);
  });
});

/* =========================================================
 * DETERMINISM
 * =======================================================*/

describe("pipeline - determinism", () => {
  it("returns identical results for same input", () => {
    const { envelope, keyPair } = makeSignedEnvelope();

    const context = {
      verifier: {
        publicKey: keyPair.publicKey,
        currentTime: Date.now(),
        latestNonce: 0,
      },
    };

    const r1 = executeVerificationPipeline(envelope, context);
    const r2 = executeVerificationPipeline(envelope, context);

    expect(r1).toEqual(r2);
  });
});

/* =========================================================
 * IMMUTABILITY
 * =======================================================*/

describe("pipeline - immutability", () => {
  it("does not mutate input envelope", () => {
    const { envelope } = makeSignedEnvelope();
    const snapshot = JSON.stringify(envelope);

    executeVerificationPipeline(envelope, {
      verifier: {
        publicKey: "0xinvalid" as any,
        currentTime: Date.now(),
        latestNonce: 0,
      },
    });

    expect(JSON.stringify(envelope)).toBe(snapshot);
  });
});