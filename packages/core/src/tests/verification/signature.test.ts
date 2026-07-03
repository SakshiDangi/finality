import {
  describe,
  expect,
  it,
} from "vitest";

import {
  makeEnvelope,
} from "../utils/makeEnvelope.js";

import {
  createIdentity,
} from "../../crypto/identity.js";

import {
  signPayload,
} from "../../crypto/signatures.js";

import {
  createSigningPayload,
  createSigningDigest,
  verifyEnvelopeSignature,
  SignatureVerificationError,
} from "../../verification/signature.js";


// core feature correctness and identity
describe("verification/signature (core)", () => {
  it("should verify a valid signed envelope", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    // bind signer identity
    envelope.header.sender = identity.address;

    // sign canonical payload
    envelope.signature = signPayload(
      createSigningPayload(envelope),
      identity.privateKey,
    );

    const result = verifyEnvelopeSignature(
      envelope,
      identity.publicKey,
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.digest).toBeDefined();
  });

  it("should reject envelope without signature", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = identity.address;

    // remove signature
    envelope.signature = "" as any;

    const result = verifyEnvelopeSignature(
      envelope,
      identity.publicKey,
    );

    expect(result.success).toBe(false);

    expect(result.error).toBe(
      SignatureVerificationError.SIGNATURE_MISSING,
    );
  });

  it("should reject verification with wrong public key", () => {
    const signer = createIdentity();
    const attacker = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = signer.address;

    envelope.signature = signPayload(
      createSigningPayload(envelope),
      signer.privateKey,
    );

    const result = verifyEnvelopeSignature(
      envelope,
      attacker.publicKey,
    );

    expect(result.success).toBe(false);

    expect(result.error).toBe(
      SignatureVerificationError.INVALID_SIGNATURE,
    );
  });

  it("should reject sender mismatch even if signature is valid", () => {
    const signer = createIdentity();

    const envelope = makeEnvelope();

    // WRONG sender injected
    envelope.header.sender =
      "0x1111111111111111111111111111111111111111";

    envelope.signature = signPayload(
      createSigningPayload(envelope),
      signer.privateKey,
    );

    const result = verifyEnvelopeSignature(
      envelope,
      signer.publicKey,
    );

    expect(result.success).toBe(false);

    expect(result.error).toBe(
      SignatureVerificationError.INVALID_SENDER,
    );
  });
});

// tamper, replay and integrity test

describe("verification/signature (integrity)", () => {
  it("should reject modified payload after signing", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = identity.address;

    envelope.signature = signPayload(
      createSigningPayload(envelope),
      identity.privateKey,
    );

    //  tamper payload AFTER signing
    envelope.payload = {
      ...envelope.payload,
      amount: 999999,
    };

    const result = verifyEnvelopeSignature(
      envelope,
      identity.publicKey,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      SignatureVerificationError.INVALID_SIGNATURE,
    );
  });

  it("should reject modified header after signing", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = identity.address;

    envelope.signature = signPayload(
      createSigningPayload(envelope),
      identity.privateKey,
    );

    //  tamper header AFTER signing
    envelope.header.nonce += 1;

    const result = verifyEnvelopeSignature(
      envelope,
      identity.publicKey,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      SignatureVerificationError.INVALID_SIGNATURE,
    );
  });

  it("should reject manually corrupted signature bytes", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = identity.address;

    envelope.signature = signPayload(
      createSigningPayload(envelope),
      identity.privateKey,
    );

    //  corrupt signature
    envelope.signature =
      ("0x" + "ff".repeat(64)) as any;

    const result = verifyEnvelopeSignature(
      envelope,
      identity.publicKey,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      SignatureVerificationError.INVALID_SIGNATURE,
    );
  });

  it("should reject nonce modification (replay protection assumption)", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = identity.address;

    envelope.signature = signPayload(
      createSigningPayload(envelope),
      identity.privateKey,
    );

    const originalNonce = envelope.header.nonce;

    //  replay / modify nonce
    envelope.header.nonce = originalNonce + 1;

    const result = verifyEnvelopeSignature(
      envelope,
      identity.publicKey,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      SignatureVerificationError.INVALID_SIGNATURE,
    );
  });
});


// canonicalization, determinism, protocol guarantees

describe("verification/signature (canonicalization + determinism)", () => {
  it("should verify identical result for reordered payload keys", () => {
    const identity = createIdentity();

    const envelopeA = makeEnvelope();
    const envelopeB = makeEnvelope();

    envelopeA.header.sender = identity.address;
    envelopeB.header.sender = identity.address;

    envelopeA.payload = {
      amount: 100,
      asset: "USDC",
    };

    envelopeB.payload = {
      asset: "USDC",
      amount: 100,
    };

    envelopeA.signature = signPayload(
      createSigningPayload(envelopeA),
      identity.privateKey,
    );

    envelopeB.signature = signPayload(
      createSigningPayload(envelopeB),
      identity.privateKey,
    );

    const resultA = verifyEnvelopeSignature(
      envelopeA,
      identity.publicKey,
    );

    const resultB = verifyEnvelopeSignature(
      envelopeB,
      identity.publicKey,
    );

    expect(resultA.success).toBe(true);
    expect(resultB.success).toBe(true);
    expect(resultA.digest).toBe(resultB.digest);
  });

  it("should produce identical digest for logically equivalent payloads", () => {
    const identity = createIdentity();

    const envelopeA = makeEnvelope();
    const envelopeB = makeEnvelope();

    envelopeA.header.sender = identity.address;
    envelopeB.header.sender = identity.address;

    envelopeA.payload = { a: 1, b: 2 };
    envelopeB.payload = { b: 2, a: 1 };

    const digestA = createSigningDigest(envelopeA);
    const digestB = createSigningDigest(envelopeB);

    expect(digestA).toBe(digestB);
  });

  it("should ignore metadata changes in signing", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = identity.address;

    envelope.metadata = {
      traceId: "trace-1",
    };

    envelope.signature = signPayload(
      createSigningPayload(envelope),
      identity.privateKey,
    );

    const modified = {
      ...envelope,
      metadata: {
        traceId: "trace-999",
      },
    };

    const result = verifyEnvelopeSignature(
      modified,
      identity.publicKey,
    );

    expect(result.success).toBe(true);
  });

  it("should exclude metadata from signing payload", () => {
    const envelope = makeEnvelope();

    const payload = createSigningPayload(envelope);

    expect(payload).not.toHaveProperty("metadata");
  });

  it("should exclude signature from signing payload", () => {
    const envelope = makeEnvelope();

    const payload = createSigningPayload(envelope);

    expect(payload).not.toHaveProperty("signature");
  });

  it("should produce deterministic signing digest across runs", () => {
    const identity = createIdentity();

    const envelope = makeEnvelope();

    envelope.header.sender = identity.address;

    envelope.payload = {
      asset: "USDC",
      amount: 100,
    };

    const d1 = createSigningDigest(envelope);
    const d2 = createSigningDigest(envelope);
    const d3 = createSigningDigest(envelope);

    expect(d1).toBe(d2);
    expect(d2).toBe(d3);
  });

  it("should fail gracefully for malformed envelope input", () => {
    const identity = createIdentity();

    const badEnvelope = null as any;

    const result = verifyEnvelopeSignature(
      badEnvelope,
      identity.publicKey,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      SignatureVerificationError.MALFORMED_ENVELOPE,
    );
  });
});