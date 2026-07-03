import {
  describe,
  expect,
  it,
} from "vitest";

import {
  derivePublicKey,
  signPayload,
  verifyPayloadSignature,
} from "../../crypto/signatures.js";

import {
  generatePrivateKey,
} from "../../crypto/identity.js";

describe(
  "crypto/signatures",
  () => {
    it(
      "should sign payload successfully",
      () => {
        const privateKey =
          generatePrivateKey();

        const payload = {
          amount: 100,
          asset: "USDC",
        };

        const signature =
          signPayload(
            payload,
            privateKey,
          );

        expect(signature)
          .toMatch(
            /^0x[a-f0-9]+$/,
          );
      },
    );

    it(
      "should verify valid signature",
      () => {
        const privateKey =
          generatePrivateKey();

        const publicKey =
          derivePublicKey(
            privateKey,
          );

        const payload = {
          amount: 100,
          asset: "ETH",
        };

        const signature =
          signPayload(
            payload,
            privateKey,
          );

        const verified =
          verifyPayloadSignature(
            payload,
            signature,
            publicKey,
          );

        expect(verified)
          .toBe(true);
      },
    );

    it(
      "should reject modified payload",
      () => {
        const privateKey =
          generatePrivateKey();

        const publicKey =
          derivePublicKey(
            privateKey,
          );

        const originalPayload = {
          amount: 100,
          asset: "USDC",
        };

        const modifiedPayload = {
          amount: 999,
          asset: "USDC",
        };

        const signature =
          signPayload(
            originalPayload,
            privateKey,
          );

        const verified =
          verifyPayloadSignature(
            modifiedPayload,
            signature,
            publicKey,
          );

        expect(verified)
          .toBe(false);
      },
    );

    it(
      "should reject invalid public key",
      () => {
        const signerPrivateKey =
          generatePrivateKey();

        const attackerPrivateKey =
          generatePrivateKey();

        const attackerPublicKey =
          derivePublicKey(
            attackerPrivateKey,
          );

        const payload = {
          settlementId:
            "settlement-1",
        };

        const signature =
          signPayload(
            payload,
            signerPrivateKey,
          );

        const verified =
          verifyPayloadSignature(
            payload,
            signature,
            attackerPublicKey,
          );

        expect(verified)
          .toBe(false);
      },
    );

    it(
      "should produce deterministic verification across reordered payload keys",
      () => {
        const privateKey =
          generatePrivateKey();

        const publicKey =
          derivePublicKey(
            privateKey,
          );

        const leftPayload = {
          amount: 100,
          asset: "USDC",
        };

        const rightPayload = {
          asset: "USDC",
          amount: 100,
        };

        const signature =
          signPayload(
            leftPayload,
            privateKey,
          );

        const verified =
          verifyPayloadSignature(
            rightPayload,
            signature,
            publicKey,
          );

        expect(verified)
          .toBe(true);
      },
    );

    it(
      "should reject malformed signature",
      () => {
        const privateKey =
          generatePrivateKey();

        const publicKey =
          derivePublicKey(
            privateKey,
          );

        const payload = {
          hello: "world",
        };

        const verified =
          verifyPayloadSignature(
            payload,
            "0xdeadbeef",
            publicKey,
          );

        expect(verified)
          .toBe(false);
      },
    );

    it(
      "should derive public key from private key",
      () => {
        const privateKey =
          generatePrivateKey();

        const publicKey =
          derivePublicKey(
            privateKey,
          );

        expect(publicKey)
          .toMatch(
            /^0x[a-f0-9]+$/,
          );
      },
    );
  },
);