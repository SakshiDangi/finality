import type {
  Envelope,
  UnsignedEnvelope,
} from "../base/envelope.js";

import type {
  HashDigest,
  PrivateKey,
  SignatureHex,
} from "../base/primitives.js";

import {
  createSigningDigest,
} from "../verification/signature.js";

import {
  signDigest,
} from "../crypto/signatures.js";
/* =========================================
 * REQUEST SIGNER INPUT
 * =======================================*/

/**
 * Canonical request signer input.
 */
export interface RequestSignerInput {
  /**
   * Unsigned protocol envelope.
   */
  envelope:
    UnsignedEnvelope;

  /**
   * Sender private key.
   */
  privateKey:
    PrivateKey;
}

/* =========================================
 * REQUEST SIGNER RESULT
 * =======================================*/

/**
 * Signed protocol envelope result.
 */
export interface RequestSignerResult {
  /**
   * Deterministic signing digest.
   */
  digest:
    HashDigest;

  /**
   * Canonical cryptographic signature.
   */
  signature:
    SignatureHex;

  /**
   * Fully signed protocol envelope.
   */
  envelope:
    Envelope;
}

/* =========================================
 * REQUEST SIGNER
 * =======================================*/

/**
 * Cryptographically signs
 * protocol envelopes.
 *
 * Flow:
 *
 * envelope
 * -> canonical digest
 * -> signature generation
 * -> signed envelope
 */
export function signRequest(
  input:
    RequestSignerInput,
): RequestSignerResult {
  /* =====================================
   * STEP 1
   * CREATE SIGNING DIGEST
   * ===================================*/

  const digest =
    createSigningDigest(
      input.envelope,
    );

  /* =====================================
   * STEP 2
   * SIGN DIGEST
   * ===================================*/

  const signature =
    signDigest(
      digest,
      input.privateKey,
    );

  /* =====================================
   * STEP 3
   * CREATE SIGNED ENVELOPE
   * ===================================*/

  const envelope:
    Envelope = {
      ...input.envelope,

      signature,
    };

  /* =====================================
   * RESULT
   * ===================================*/

  return {
    digest,

    signature,

    envelope,
  };
}