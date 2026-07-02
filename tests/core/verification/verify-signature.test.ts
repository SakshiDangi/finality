import { describe, expect, it } from "vitest";

import { generateWallet } from "@/core/crypto/wallet";
import { signPayload } from "@/core/crypto/sign";

import {
  validateSignature,
  isValidSignature,
} from "@/core/verification/verify-signature";

import { SignatureValidationError } from "@/core/verification/errors";


describe("validateSignature", () => {
it("accepts a valid signed payload", async () => {
  const wallet = generateWallet();

  const payload = {
    id: 1,
    amount: 100,
  };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  const result = validateSignature({
    payload,
    signedPayload,
    expectedSigner: wallet.address,
  });

  expect(result.valid).toBe(true);
  expect(result.reason).toBe("VALID");
});


it("rejects missing signatures", async () => {
  const wallet = generateWallet();

  const payload = { id: 1 };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  signedPayload.signature = "";

  expect(() =>
    validateSignature({
      payload,
      signedPayload,
      expectedSigner: wallet.address,
    })
  ).toThrow(SignatureValidationError);
});


// Invalid signer failed: generate two wallets. wallet a signs. wallet b is expected
it("rejects an unexpected signer", async () => {
  const signer = generateWallet();
  const attacker = generateWallet();

  const payload = {
    amount: 100,
  };

  const signedPayload = await signPayload(
    payload,
    signer.privateKey
  );

  expect(() =>
    validateSignature({
      payload,
      signedPayload,
      expectedSigner: attacker.address,
    })
  ).toThrow(SignatureValidationError);
});


it("rejects modified payloads", async () => {
  const wallet = generateWallet();

  const original = {
    amount: 100,
  };

  const signedPayload = await signPayload(
    original,
    wallet.privateKey
  );

  const tampered = {
    amount: 999,
  };

  expect(() =>
    validateSignature({
      payload: tampered,
      signedPayload,
      expectedSigner: wallet.address,
    })
  ).toThrow(SignatureValidationError);
});


it("rejects modified digests", async () => {
  const wallet = generateWallet();

  const payload = {
    amount: 100,
  };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  signedPayload.digest =
    "0x" + "0".repeat(64);

  expect(() =>
    validateSignature({
      payload,
      signedPayload,
      expectedSigner: wallet.address,
    })
  ).toThrow(SignatureValidationError);
});


// recovered signer matches
it("validates signatures from the original signer", async () => {
  const wallet = generateWallet();

  const payload = {
    hello: "world",
  };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  const result = validateSignature({
    payload,
    signedPayload,
    expectedSigner: wallet.address,
  });

  expect(result.valid).toBe(true);
});


// case-sensitive addresses
it("accepts mixed-case signer addresses", async () => {
  const wallet = generateWallet();

  const payload = { x: 1 };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  const result = validateSignature({
    payload,
    signedPayload,
    expectedSigner: wallet.address.toUpperCase(),
  });

  expect(result.valid).toBe(true);
});


// isValidSignature() returns true
it("returns true for valid signatures", async () => {
  const wallet = generateWallet();

  const payload = {
    test: true,
  };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  expect(
    isValidSignature({
      payload,
      signedPayload,
      expectedSigner: wallet.address,
    })
  ).toBe(true);
});


// isVaildSignature() returns false
it("returns false for invalid signatures", async () => {
  const wallet = generateWallet();

  const payload = {
    x: 1,
  };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  signedPayload.signature = "";

  expect(
    isValidSignature({
      payload,
      signedPayload,
      expectedSigner: wallet.address,
    })
  ).toBe(false);
});


// canonical serialization
it("accepts payloads with different object key ordering", async () => {
  const wallet = generateWallet();

  const payload1 = {
    a: 1,
    b: 2,
  };

  const signedPayload = await signPayload(
    payload1,
    wallet.privateKey
  );

  const payload2 = {
    b: 2,
    a: 1,
  };

  const result = validateSignature({
    payload: payload2,
    signedPayload,
    expectedSigner: wallet.address,
  });

  expect(result.valid).toBe(true);
});


// signature replay consistency
it("produces deterministic validation results", async () => {
  const wallet = generateWallet();

  const payload = {
    amount: 100,
    receiver: "alice",
  };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  const expectedSigner =
      wallet.address;


  const fixedNow =
    1700000000000;


  const first = validateSignature(
    {
      payload,
      signedPayload,
      expectedSigner,
    },
    {
      now: fixedNow,
    }
  );
  
  const second = validateSignature(
    {
      payload,
      signedPayload,
      expectedSigner,
    },
    {
      now: fixedNow,
    }
  );
  
  expect(first).toEqual(second);
});


// empty expected signer
it("rejects empty expected signer", async () => {
  const wallet = generateWallet();

  const payload = {
    x: 1,
  };

  const signedPayload = await signPayload(
    payload,
    wallet.privateKey
  );

  expect(() =>
    validateSignature({
      payload,
      signedPayload,
      expectedSigner: "",
    })
  ).toThrow(SignatureValidationError);
});

});