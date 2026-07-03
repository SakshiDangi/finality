import {
  Envelope,
} from "../base/envelope.js";

import {
  PublicKey,
} from "../crypto/identity.js";

import {
  verifyEnvelopeSignature,
  SignatureVerificationResult,
} from "./signature.js";

import {
  verifyTimestamp,
  TimestampVerificationResult,
  TimestampVerificationOptions,
  DEFAULT_TIMESTAMP_OPTIONS,
} from "./timestamp.js";

import {
  verifyNonce,
  NonceVerificationResult,
} from "./nonce.js";

/* =========================================
 * VERIFICATION STAGES
 * =======================================*/

export enum VerificationStage {
  SIGNATURE =
    "SIGNATURE",

  TIMESTAMP =
    "TIMESTAMP",

  NONCE =
    "NONCE",

  COMPLETE =
    "COMPLETE",
}

/* =========================================
 * VERIFIER CONTEXT
 * =======================================*/

export interface VerifierContext {
  /**
   * Sender public key.
   */
  publicKey:
    PublicKey;

  /**
   * Deterministic current time.
   */
  currentTime:
    number;

  /**
   * Latest accepted nonce
   * for sender.
   */
  latestNonce:
    number;

  /**
   * Timestamp validation config.
   */
  timestampOptions?:
    TimestampVerificationOptions;
}

/* =========================================
 * PROTOCOL VERIFICATION RESULT
 * =======================================*/

export interface ProtocolVerificationResult {
  /**
   * Overall verification result.
   */
  success: boolean;

  /**
   * Verification stage reached.
   */
  stage:
    VerificationStage;

  /**
   * Signature validation result.
   */
  signature?:
    SignatureVerificationResult;

  /**
   * Timestamp validation result.
   */
  timestamp?:
    TimestampVerificationResult;

  /**
   * Nonce validation result.
   */
  nonce?:
    NonceVerificationResult;

  /**
   * Human-readable diagnostics.
   */
  reason?: string;
}

/* =========================================
 * UNIFIED VERIFICATION ENGINE
 * =======================================*/

/**
 * Performs complete protocol
 * envelope verification.
 *
 * Validation flow:
 *
 * signature
 * -> timestamp
 * -> nonce
 */
export function verifyEnvelope(
  envelope: Envelope,

  context: VerifierContext,
): ProtocolVerificationResult {
  /**
   * STEP 1
   * Signature verification.
   */
  const signatureResult =
    verifyEnvelopeSignature(
      envelope,
      context.publicKey,
    );

  if (
    !signatureResult.success
  ) {
    return {
      success: false,

      stage:
        VerificationStage.SIGNATURE,

      signature:
        signatureResult,

      reason:
        signatureResult.reason,
    };
  }

  /**
   * STEP 2
   * Timestamp verification.
   */
  const timestampResult =
    verifyTimestamp(
      envelope,

      context.currentTime,

      context.timestampOptions ??
        DEFAULT_TIMESTAMP_OPTIONS,
    );

  if (
    !timestampResult.success
  ) {
    return {
      success: false,

      stage:
        VerificationStage.TIMESTAMP,

      timestamp:
        timestampResult,

      signature:
        signatureResult,

      reason:
        timestampResult.reason,
    };
  }

  /**
   * STEP 3
   * Nonce verification.
   */
  const nonceResult =
    verifyNonce(
      envelope,

      context.latestNonce,
    );

  if (
    !nonceResult.success
  ) {
    return {
      success: false,

      stage:
        VerificationStage.NONCE,

      nonce:
        nonceResult,

      signature:
        signatureResult,

      timestamp:
        timestampResult,

      reason:
        nonceResult.reason,
    };
  }

  /**
   * Successful verification.
   */
  return {
    success: true,

    stage:
      VerificationStage.COMPLETE,

    signature:
      signatureResult,

    timestamp:
      timestampResult,

    nonce:
      nonceResult,
  };
}