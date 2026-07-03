
import { describe, expect, it } from "vitest";

import { makeEnvelope } from "../utils/makeEnvelope.js";

import {
  verifyEnvelope,
  VerificationStage,
} from "../../verification/verifier.js";

import {
  generateKeyPair,
  deriveAddress,
} from "../../crypto/identity.js";

import { signPayload } from "../../crypto/signatures.js";

import {
  SignatureVerificationError,
} from "../../verification/signature.js";

import {
  TimestampVerificationError,
} from "../../verification/timestamp.js";

import {
  NonceVerificationError,
} from "../../verification/nonce.js";


describe("verifyEnvelope - full pipeline", () => {
  it("returns COMPLETE for valid envelope", () => {
    const keyPair = generateKeyPair();
    const sender = deriveAddress(keyPair.publicKey);

    const base = makeEnvelope();

    const envelope = {
      ...base,
      header: {
        ...base.header,
        sender,
      },
    };

    const signature = signPayload(
      {
        header: envelope.header,
        payload: envelope.payload,
      },
      keyPair.privateKey,
    );

    const result = verifyEnvelope(
      { ...envelope, signature },
      {
        publicKey: keyPair.publicKey,
        currentTime: envelope.header.timestamp, // IMPORTANT FIX
        latestNonce: 0,
      },
    );

    expect(result.success).toBe(true);
    expect(result.stage).toBe(VerificationStage.COMPLETE);
  });
});


describe("verifier - baseline correctness", () => {
  it("accepts valid envelope end-to-end", () => {
    const keyPair = generateKeyPair();
    const sender = deriveAddress(keyPair.publicKey);

    const base = makeEnvelope();

    const envelope = {
      ...base,
      header: {
        ...base.header,
        sender,
      },
    };

    const signature = signPayload(
      {
        header: envelope.header,
        payload: envelope.payload,
      },
      keyPair.privateKey,
    );

    const result = verifyEnvelope(
      { ...envelope, signature },
      {
        publicKey: keyPair.publicKey,
        currentTime: envelope.header.timestamp,
        latestNonce: 0,
      },
    );

    expect(result.success).toBe(true);
    expect(result.stage).toBe(VerificationStage.COMPLETE);
  });
});


describe("verifier - stage isolation", () => {
  it("stops immediately on invalid signature", () => {
    const envelope = makeEnvelope();

    const result = verifyEnvelope(
      {
        ...envelope,
        signature: "0xdeadbeef" as any,
      },
      {
        publicKey: "0xinvalid" as any,
        currentTime: envelope.header.timestamp,
        latestNonce: 0,
      },
    );

    expect(result.success).toBe(false);
    expect(result.stage).toBe(VerificationStage.SIGNATURE);
    expect(result.timestamp).toBeUndefined();
    expect(result.nonce).toBeUndefined();
  });
});


describe("verifier - timestamp security", () => {
  it("rejects expired envelopes", () => {
    const keyPair = generateKeyPair();
    const sender = deriveAddress(keyPair.publicKey);

    const base = makeEnvelope();

    const envelope = {
      ...base,
      header: {
        ...base.header,
        sender,
        timestamp: 1000,
        ttl: 1000,
      },
    };

    const signature = signPayload(
      {
        header: envelope.header,
        payload: envelope.payload,
      },
      keyPair.privateKey,
    );

    const result = verifyEnvelope(
      { ...envelope, signature },
      {
        publicKey: keyPair.publicKey,
        currentTime: 3000, // still valid signature stage, reaches timestamp
        latestNonce: 0,
      },
    );

    expect(result.success).toBe(false);
    expect(result.stage).toBe(VerificationStage.TIMESTAMP);
  });
});


// multi-envelop nonce progression
describe("verifier - multi-envelope nonce progression", () => {
  it("accepts sequential nonces across multiple envelopes", () => {
    const keyPair = generateKeyPair();
    const sender = deriveAddress(keyPair.publicKey);

    const base = makeEnvelope({
      header: {
        ...makeEnvelope().header,
        sender,
      },
    });

    const makeSigned = (nonce: number) => {
      const envelope = {
        ...base,
        header: {
          ...base.header,
          sender,
          nonce,
        },
      };

      const signature = signPayload(
        { header: envelope.header, payload: envelope.payload },
        keyPair.privateKey,
      );

      return { ...envelope, signature };
    };

    const r1 = verifyEnvelope(makeSigned(1), {
      publicKey: keyPair.publicKey,
      currentTime: base.header.timestamp,
      latestNonce: 0,
    });

    const r2 = verifyEnvelope(makeSigned(2), {
      publicKey: keyPair.publicKey,
      currentTime: base.header.timestamp,
      latestNonce: 1,
    });

    const r3 = verifyEnvelope(makeSigned(3), {
      publicKey: keyPair.publicKey,
      currentTime: base.header.timestamp,
      latestNonce: 2,
    });

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
  });
});

// cross domain signature isolation attack
describe("verifier - domain isolation", () => {
  it("rejects envelope if domain is tampered after signing", () => {
    const keyPair = generateKeyPair();
    const sender = deriveAddress(keyPair.publicKey);

    const envelope = makeEnvelope({
      header: {
        ...makeEnvelope().header,
        sender,
        domain: "DOMAIN_A",
      },
    });

    const signature = signPayload(
      { header: envelope.header, payload: envelope.payload },
      keyPair.privateKey,
    );

    //  attacker modifies domain AFTER signing
    const tampered = {
      ...envelope,
      header: {
        ...envelope.header,
        domain: "DOMAIN_B",
      },
      signature,
    };

    const result = verifyEnvelope(tampered, {
      publicKey: keyPair.publicKey,
      currentTime: envelope.header.timestamp,
      latestNonce: 0,
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe(VerificationStage.SIGNATURE);
  });
});


// timestamp skew fuzz
describe("verifier - timestamp skew resistance", () => {
  it("rejects extreme future clock drift", () => {
  const keyPair = generateKeyPair();
  const sender = deriveAddress(keyPair.publicKey);

  const base = makeEnvelope();

  const envelope = {
    ...base,
    header: {
      ...base.header,
      sender,
    },
  };

  const signature = signPayload(
    { header: envelope.header, payload: envelope.payload },
    keyPair.privateKey,
  );

  const result = verifyEnvelope(
    { ...envelope, signature },
    {
      publicKey: keyPair.publicKey,
      currentTime: envelope.header.timestamp + 1_000_000,
      latestNonce: 0,
    },
  );

  expect(result.success).toBe(false);
  expect(result.stage).toBe(VerificationStage.TIMESTAMP);
});
});


// signature replay attack across identical envelops
describe("verifier - signature replay attack", () => {
it("rejects reused signature on modified nonce", () => {
  const keyPair = generateKeyPair();
  const sender = deriveAddress(keyPair.publicKey);

  // 1. Create single base envelope
  const base = makeEnvelope();

  const envelope = {
    ...base,
    header: {
      ...base.header,
      sender,
      nonce: 1,
    },
  };

  // 2. SIGN EXACT SAME OBJECT
  const signature = signPayload(
    { header: envelope.header, payload: envelope.payload },
    keyPair.privateKey,
  );

  // 3. VALID ORIGINAL (must pass)
  const original = verifyEnvelope(
    { ...envelope, signature },
    {
      publicKey: keyPair.publicKey,
      currentTime: envelope.header.timestamp,
      latestNonce: 0,
    },
  );

  // 4. ATTACK: modify nonce AFTER signing
  const tampered = {
    ...envelope,
    header: {
      ...envelope.header,
      nonce: 2, // changed AFTER signing
    },
    signature,
  };

  const result = verifyEnvelope(tampered, {
    publicKey: keyPair.publicKey,
    currentTime: envelope.header.timestamp,
    latestNonce: 1,
  });

  expect(original.success).toBe(true);
  expect(result.success).toBe(false);

  // IMPORTANT: signature breaks first because nonce is part of signed data
  expect(result.stage).toBe(VerificationStage.SIGNATURE);
});
});

// mutation attack (payload tampering after signature)
describe("verifier - payload mutation attack", () => {
  it("rejects modified payload after signing", () => {
    const keyPair = generateKeyPair();
    const sender = deriveAddress(keyPair.publicKey);

    const envelope = makeEnvelope({
      header: {
        ...makeEnvelope().header,
        sender,
      },
    });

    const signature = signPayload(
      { header: envelope.header, payload: envelope.payload },
      keyPair.privateKey,
    );

    //  attacker changes payload AFTER signing
    const tampered = {
      ...envelope,
      payload: {
        amount: 999999, // modified
        asset: "USDC",
      },
      signature,
    };

    const result = verifyEnvelope(tampered, {
      publicKey: keyPair.publicKey,
      currentTime: envelope.header.timestamp,
      latestNonce: 0,
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe(VerificationStage.SIGNATURE);
  });
});

// Deterministic replay under same context (anti-randomness guarantee)
describe("verifier - deterministic replay stability", () => {
  it("produces identical results across multiple executions", () => {
    const keyPair = generateKeyPair();
    const sender = deriveAddress(keyPair.publicKey);

    const envelope = makeEnvelope({
      header: {
        ...makeEnvelope().header,
        sender,
      },
    });

    const signature = signPayload(
      { header: envelope.header, payload: envelope.payload },
      keyPair.privateKey,
    );

    const input = { ...envelope, signature };

    const context = {
      publicKey: keyPair.publicKey,
      currentTime: envelope.header.timestamp,
      latestNonce: 0,
    };

    const r1 = verifyEnvelope(input, context);
    const r2 = verifyEnvelope(input, context);

    expect(r1).toEqual(r2);
    expect(r1.success).toBe(r2.success);
    expect(r1.stage).toBe(r2.stage);
  });
});