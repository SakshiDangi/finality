import {
  protocolHash,
} from "../crypto/hashing.js";

import {
  signDigest,
} from "../crypto/signatures.js";

import type {
  HashDigest,
  PrivateKey,
  PublicKey,
  SignatureHex as Signature,
} from "../base/primitives.js";

import type {
  SettlementReceipt,
} from "./request-settlement.js";

/* =========================================
 * VALIDATOR ID
 * =======================================*/

/**
 * Canonical validator identifier.
 */
export type ValidatorId = string;

/* =========================================
 * ATTESTATION
 * =======================================*/

/**
 * Immutable attestation receipt.
 *
 * Represents a validator's signed
 * approval of a settlement receipt.
 *
 * Used for:
 * - validator consensus
 * - execution finalization
 * - distributed verification
 * - auditability
 */
export interface AttestationReceipt {

  /**
   * Receipt hash.
   */
  digest:
    HashDigest;

  /**
   * Validator identity.
   */
  validator:
    ValidatorId;

  /**
   * Validator public key.
   */
  publicKey:
    PublicKey;

  /**
   * secp256k1 signature.
   */
  signature:
    Signature;

  /**
   * Deterministic timestamp.
   */
  attestedAt:
    number;
}

/* =========================================
 * ATTESTATION RESULT
 * =======================================*/

export interface AttestationResult {

  /**
   * Success state.
   */
  success:
    boolean;

  /**
   * Receipt digest.
   */
  digest:
    HashDigest;

  /**
   * Produced attestation receipt.
   */
  attestation?:
    AttestationReceipt;
  /**
   * Failure reason.
   */
  reason?:
    string;
}

/* =========================================
 * REQUEST ATTESTATION
 * =======================================*/

/**
 * Creates a validator attestation
 * for a settled request.
 *
 * Flow
 *
 * receipt
 * → canonical JSON
 * → protocolHash()
 * → signDigest()
 * → attestation
 */
export function attestSettlement(

  receipt:
    SettlementReceipt,

  validator:
    ValidatorId,

  publicKey:
    PublicKey,

  privateKey:
    PrivateKey,

): AttestationResult {

  try {

    const digest =
      protocolHash(
        JSON.stringify(
          receipt,
        ),
      );

    const signature =
      signDigest(
        digest,
        privateKey,
      );

    const attestation:
      AttestationReceipt = {

      digest,

      validator,

      publicKey,

      signature,

      attestedAt:
        Date.now(),

    };

    return {

      success: true,

      digest,

      attestation,

    };

  } catch (error) {

    return {

      success: false,

      digest:
        protocolHash(
          "ATTESTATION_FAILURE",
        ),

      reason:
        error instanceof Error
          ? error.message
          : "Unknown attestation failure",

    };

  }

}