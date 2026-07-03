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
  signPayload,
  verifyPayloadSignature,
} from "../../crypto/signatures.js";

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

        /**
         * Canonicalize envelope.
         *
         * IMPORTANT:
         * metadata and signature
         * MUST NOT participate
         * in signing boundary.
         */
        const canonicalPayload =
          canonicalizeEnvelope({
            ...unsignedEnvelope,

            signature:
              "0x00",
          } as Envelope);

        expect(
          typeof canonicalPayload,
        ).toBe("string");

        /**
         * Deterministic protocol hash.
         */
        const digest =
          hashString(
            canonicalPayload,
          );

        expect(digest)
          .toMatch(
            /^0x[a-f0-9]+$/,
          );

        /**
         * Sign canonical payload.
         */
        const signature =
          signPayload(
            JSON.parse(
              canonicalPayload,
            ),
            identity.privateKey,
          );

        expect(signature)
          .toMatch(
            /^0x[a-f0-9]+$/,
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
          verifyPayloadSignature(
            {
              header:
                envelope.header,

              payload:
                envelope.payload,
            },
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

        /**
         * Original payload.
         */
        const payload = {
          amount:
            100,

          asset:
            "USDC",
        };

        /**
         * Generate signature.
         */
        const signature =
          signPayload(
            payload,
            identity.privateKey,
          );

        /**
         * Tamper after signing.
         */
        const tamperedPayload = {
          amount:
            999999,

          asset:
            "USDC",
        };

        /**
         * Verification MUST fail.
         */
        const verified =
          verifyPayloadSignature(
            tamperedPayload,
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

        const payload = {
          operation:
            "settlement",

          amount:
            500,
        };

        /**
         * Sign using signer identity.
         */
        const signature =
          signPayload(
            payload,
            signer.privateKey,
          );

        /**
         * Verify using attacker key.
         *
         * MUST fail.
         */
        const verified =
          verifyPayloadSignature(
            payload,
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