import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Envelope,
} from "../../base/envelope.js";

import type {
  Header,
} from "../../base/header.js";

import {
  EnvelopeSchema,
} from "../../base/envelope.js";

import {
  canonicalJSONStringify,
  canonicalizeEnvelope,
} from "../../crypto/canonical.js";

import {
  hashCanonical,
  hashString,
} from "../../crypto/hashing.js";

import {
  createIdentity,
} from "../../crypto/identity.js";

import {
  signEnvelope,
  verifyDigestSignature,
} from "../../crypto/signatures.js";

import {
  createSigningDigest,
} from "../../verification/signature.js";

describe(
  "crypto/integration",
  () => {
    it(
      "should execute complete protocol signing pipeline",
      () => {
        /**
         * Create protocol actor.
         *
         * Simulates:
         * - validator
         * - relayer
         * - wrapper
         * - settlement engine
         */
        const identity =
          createIdentity(
            "validator-1",
          );

        /**
         * Production-grade protocol header.
         */
        const header: Header = {
          messageId:
            "msg-1",

          domain:
            "FINALITY_CORE_V1",

          messageKind:
            "REQUEST",

          sender:
            identity.address,

          publicKey:
            identity.publicKey,

          timestamp:
            Date.now(),

          nonce:
            1,

          sequence:
            1,

          ttl:
            30_000,

          signatureAlgorithm:
            "SECP256K1",

          priority:
            "NORMAL",

          protocol:
            "FINALITY",

          version:
            "1.0.0",
        };

        /**
         * Unsigned transport envelope.
         */
        const unsignedEnvelope = {
          header,

          payload: {
            asset:
              "USDC",

            amount:
              100,

            destination:
              "wallet-1",

            chainId:
              1,
          },
        };



        const signature =
          signEnvelope(
            unsignedEnvelope,
            identity.privateKey,
          );
        
        const digest =
          createSigningDigest(
            unsignedEnvelope,
          );

        /**
         * Final signed envelope.
         */
        const envelope: Envelope =
          {
            ...unsignedEnvelope,

            signature,

            metadata: {
              relay:
                "validator-a",

              region:
                "ap-south-1",

              traceId:
                "trace-123",
            },
          };

        /**
         * Envelope MUST pass
         * protocol schema validation.
         */
        const validation =
          EnvelopeSchema.safeParse(
            envelope,
          );

        expect(
          validation.success,
        ).toBe(true);

        /**
         * Signature verification.
         *
         * Uses ONLY:
         * - header
         * - payload
         *
         * Metadata excluded.
         */
        const verified =
          verifyDigestSignature(
            digest,
            envelope.signature,
            identity.publicKey,
          );

        expect(verified)
          .toBe(true);
      },
    );

    it(
      "should reject tampered payloads",
      () => {
        const identity =
          createIdentity(
            "validator-2",
          );
    
        const envelope: Envelope = {
          header: {
            messageId:
              "msg-2",
    
            domain:
              "FINALITY_CORE_V1",
    
            messageKind:
              "REQUEST",
    
            sender:
              identity.address,
    
            publicKey:
              identity.publicKey,
    
            timestamp:
              Date.now(),
    
            nonce:
              2,
    
            sequence:
              2,
    
            ttl:
              30_000,
    
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
            amount:
              100,
    
            asset:
              "USDC",
          },
    
          signature:
            "0x00",
        };
    
        /**
         * Sign original envelope.
         */
        const signature =
          signEnvelope(
            envelope,
            identity.privateKey,
          );
    
        /**
         * Tamper AFTER signing.
         */
        envelope.payload.amount =
          999999;
    
        const digest =
          createSigningDigest(
            envelope,
          );
    
        /**
         * MUST fail.
         */
        const verified =
          verifyDigestSignature(
            digest,
            signature,
            identity.publicKey,
          );
    
        expect(verified)
          .toBe(false);
      },
    );

    it(
      "should reject signatures from different identities",
      () => {
        const signer =
          createIdentity(
            "validator-a",
          );
    
        const attacker =
          createIdentity(
            "validator-b",
          );
    
        const envelope: Envelope = {
          header: {
            messageId:
              "msg-attacker",
    
            domain:
              "FINALITY_CORE_V1",
    
            messageKind:
              "REQUEST",
    
            sender:
              signer.address,
    
            publicKey:
              signer.publicKey,
    
            timestamp:
              Date.now(),
    
            nonce:
              10,
    
            sequence:
              10,
    
            ttl:
              30_000,
    
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
            operation:
              "settlement",
    
            amount:
              500,
          },
    
          signature:
            "0x00",
        };
    
        /**
         * Sign using signer key.
         */
        const signature =
          signEnvelope(
            envelope,
            signer.privateKey,
          );
    
        const digest =
          createSigningDigest(
            envelope,
          );
    
        /**
         * Verify using attacker key.
         *
         * MUST fail.
         */
        const verified =
          verifyDigestSignature(
            digest,
            signature,
            attacker.publicKey,
          );
    
        expect(verified)
          .toBe(false);
      },
    );

    it(
      "should produce deterministic hashes for reordered objects",
      () => {
        const left = {
          asset:
            "USDC",

          amount:
            100,

          chainId:
            1,
        };

        const right = {
          chainId:
            1,

          amount:
            100,

          asset:
            "USDC",
        };

        const leftHash =
          hashCanonical(
            left,
          );

        const rightHash =
          hashCanonical(
            right,
          );

        /**
         * Canonical hashing MUST
         * ignore key ordering.
         */
        expect(leftHash)
          .toBe(rightHash);
      },
    );

    it(
      "should isolate metadata from signing boundary",
      () => {
        const identity =
          createIdentity(
            "validator-3",
          );

        const envelope: Envelope =
          {
            header: {
              messageId:
                "msg-3",

              domain:
                "FINALITY_CORE_V1",

              messageKind:
                "REQUEST",

              sender:
                identity.address,

              publicKey:
                identity.publicKey,

              timestamp:
                Date.now(),

              nonce:
                3,

              sequence:
                3,

              ttl:
                30_000,

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
              amount:
                42,
            },

            signature:
              "0x00",

            metadata: {
              relay:
                "relay-a",

              region:
                "us-east-1",
            },
          };

        const canonical =
          canonicalizeEnvelope(
            envelope,
          );

        /**
         * Metadata MUST NOT
         * enter signing boundary.
         */
        expect(canonical)
          .not
          .toContain(
            "metadata",
          );

        /**
         * Signature MUST NOT
         * enter signing boundary.
         */
        expect(canonical)
          .not
          .toContain(
            `"signature":`,
          );
      },
    );

    it(
      "should produce stable canonical serialization",
      () => {
        const left =
          canonicalJSONStringify({
            payload: {
              z: 1,
              a: 2,
            },
          });

        const right =
          canonicalJSONStringify({
            payload: {
              a: 2,
              z: 1,
            },
          });

        /**
         * Same logical payload
         * MUST always produce
         * identical canonical bytes.
         */
        expect(left)
          .toBe(right);
      },
    );
  },
);