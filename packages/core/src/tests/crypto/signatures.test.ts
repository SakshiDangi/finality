import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Envelope,
} from "../../base/envelope.js";

import {
  generatePrivateKey,
} from "../../crypto/identity.js";

import {
  createSigningDigest,
} from "../../verification/signature.js";

import {
  derivePublicKey,
  signEnvelope,
  verifyDigestSignature,
} from "../../crypto/signatures.js";

describe(
  "crypto/signatures",
  () => {
    /**
     * Deterministic test envelope.
     */
    function createEnvelope(): Envelope {
      return {
        header: {
          messageId:
            "msg-1",
    
          domain:
            "FINALITY_CORE_V1",
    
          messageKind:
            "REQUEST",
    
          sender:
            "0x1111111111111111111111111111111111111111",
    
          publicKey:
            "0x02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    
          timestamp:
            Date.now(),
    
          nonce: 1,
    
          sequence: 1,
    
          ttl:
            30000,
    
          signatureAlgorithm:
            "SECP256K1",
    
          priority:
            "NORMAL",
    
          protocol:
            "FINALITY",
    
          version:
            "1.0.0",
        },
    
        payload: {
          amount: 100,
          asset: "USDC",
        },
    
        signature:
          "0xdeadbeef",
      };
    }

    it(
      "should sign envelope successfully",
      () => {
        const privateKey =
          generatePrivateKey();

        const envelope =
          createEnvelope();

        const signature =
          signEnvelope(
            envelope,
            privateKey,
          );

        expect(signature)
          .toMatch(
            /^0x[a-f0-9]+$/i,
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

        const envelope =
          createEnvelope();

        envelope.header.publicKey =
          publicKey;

        const signature =
          signEnvelope(
            envelope,
            privateKey,
          );

        const digest =
          createSigningDigest(
            envelope,
          );

        const verified =
          verifyDigestSignature(
            digest,
            signature,
            publicKey,
          );

        expect(verified)
          .toBe(true);
      },
    );

    it(
      "should reject modified envelope",
      () => {
        const privateKey =
          generatePrivateKey();

        const publicKey =
          derivePublicKey(
            privateKey,
          );

        const envelope =
          createEnvelope();

        envelope.header.publicKey =
          publicKey;

        const signature =
          signEnvelope(
            envelope,
            privateKey,
          );

        /**
         * Tamper AFTER signing.
         */
        envelope.payload.amount =
          999;

        const digest =
          createSigningDigest(
            envelope,
          );

        const verified =
          verifyDigestSignature(
            digest,
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

        const envelope =
          createEnvelope();

        const signature =
          signEnvelope(
            envelope,
            signerPrivateKey,
          );

        const digest =
          createSigningDigest(
            envelope,
          );

        const verified =
          verifyDigestSignature(
            digest,
            signature,
            attackerPublicKey,
          );

        expect(verified)
          .toBe(false);
      },
    );

    it(
      "should produce deterministic digest across reordered payload keys",
      () => {
        const left: Envelope = {
          header: {
            messageId:
              "msg-1",
        
            domain:
              "FINALITY_CORE_V1",
        
            messageKind:
              "REQUEST",
        
            sender:
              "0x1111111111111111111111111111111111111111",
        
            publicKey:
              "0x02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        
            timestamp:
              1,
        
            nonce: 1,
        
            sequence: 1,
        
            ttl: 30000,
        
            signatureAlgorithm:
              "SECP256K1",
        
            priority:
              "NORMAL",
        
            protocol:
              "FINALITY",
        
            version:
              "1.0.0",
          },
        
          payload: {
            amount: 100,
            asset: "USDC",
          },
        
          signature:
            "0xdeadbeef",
        };

        const right: Envelope = {
          header:
            left.header,
        
          payload: {
            asset: "USDC",
            amount: 100,
          },
        
          signature:
            "0xdeadbeef",
        };

        const leftDigest =
          createSigningDigest(
            left,
          );

        const rightDigest =
          createSigningDigest(
            right,
          );

        expect(leftDigest)
          .toBe(
            rightDigest,
          );
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

        const envelope =
          createEnvelope();

        const digest =
          createSigningDigest(
            envelope,
          );

        const verified =
          verifyDigestSignature(
            digest,
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
            /^0x[a-f0-9]+$/i,
          );
      },
    );
  },
);