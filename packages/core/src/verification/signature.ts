import {
  type Envelope,
  type UnsignedEnvelope,
} from "../base/envelope.js";

import {
  canonicalizeEnvelope,
} from "../crypto/canonical.js";

import {
  deriveAddress,
  type PublicKey,
} from "../crypto/identity.js";

import {
  protocolHash,
} from "../crypto/hashing.js";

import {
  verifyDigestSignature,
} from "../crypto/signatures.js";

import type {
  Signature,
} from "../crypto/signatures.js";

/* =========================================
 * VERIFICATION ERROR CODES
 * =======================================*/

export enum SignatureVerificationError {
  SIGNATURE_MISSING =
    "SIGNATURE_MISSING",

  INVALID_SIGNATURE =
    "INVALID_SIGNATURE",

  ADDRESS_MISMATCH =
    "ADDRESS_MISMATCH",

  MALFORMED_ENVELOPE =
    "MALFORMED_ENVELOPE",
}

/* =========================================
 * VERIFICATION RESULT
 * =======================================*/

export interface SignatureVerificationResult {
  /**
   * Verification success state.
   */
  success: boolean;

  /**
   * Failure reason.
   */
  error?:
    SignatureVerificationError;

  /**
   * Human-readable diagnostics.
   */
  reason?: string;

  /**
   * Deterministic signing digest.
   */
  digest?: string;
}

/* =========================================
 * SIGNING PAYLOAD
 * =======================================*/

/**
 * Creates deterministic
 * signing payload.
 *
 * IMPORTANT:
 * - excludes signature
 * - excludes metadata
 */
export function createSigningPayload(
  envelope:
  Envelope |
  UnsignedEnvelope,
) {
  return {
    header:
      envelope.header,

    payload:
      envelope.payload,
  };
}

/**
 * Produces deterministic
 * protocol signing digest.
 */
export function createSigningDigest(
  envelope:
  Envelope |
  UnsignedEnvelope,
): string {
  const canonical =
    canonicalizeEnvelope(
      createSigningPayload(
        envelope,
      ),
    );

  return protocolHash(
    canonical,
  );
}

/* =========================================
 * SIGNATURE VERIFICATION
 * =======================================*/

/**
 * Verifies envelope signature integrity.
 *
 * Validation flow:
 *
 * envelope
 * -> canonicalize
 * -> hash
 * -> verify signature
 * -> derive signer address
 * -> compare sender
 */
export function verifyEnvelopeSignature(
  envelope: Envelope,
): SignatureVerificationResult {
  try {
    /**
     * Signature existence check.
     */

    if (
      !envelope.signature
    ) {
      return {
        success: false,

        error:
          SignatureVerificationError.SIGNATURE_MISSING,

        reason:
          "Envelope signature missing",
      };
    }

    const publicKey =
      envelope.header.publicKey;
    
    if (
      !publicKey
    ) {
      return {
        success: false,
    
        error:
          SignatureVerificationError.MALFORMED_ENVELOPE,
    
        reason:
          "Envelope public key missing",
      };
    }
    
    if (
        !/^0x[a-fA-F0-9]+$/.test(
          publicKey,
        )
      ) {
      return {
        success: false,
    
        error:
          SignatureVerificationError.MALFORMED_ENVELOPE,
    
        reason:
          "Invalid public key format",
      };
    }

    
    /**
     * Verify cryptographic signature.
     */
    

    const digest =
      createSigningDigest(
        envelope,
      );

    const isValidSignature =
      verifyDigestSignature(
        digest,
    
        envelope.signature as Signature,
    
        publicKey as PublicKey,
      );

    if (
      !isValidSignature
    ) {
      return {
        success: false,

        error:
          SignatureVerificationError.INVALID_SIGNATURE,

        reason:
          "Envelope signature verification failed",

        digest,
      };
    }

    /**
     * Derive protocol address
     * from public key.
     */
    const derivedAddress =
      deriveAddress(
        publicKey as PublicKey,
      );

    /**
     * Validate sender identity.
     */
    if (
      derivedAddress.toLowerCase() !==
      envelope.header.sender.toLowerCase()
    ) {
      return {
        success: false,

        error:
          SignatureVerificationError.ADDRESS_MISMATCH,

        reason:
          "Sender address does not match derived public key address",

        digest,
      };
    }

    /**
     * Successful verification.
     */
    return {
      success: true,

      digest,
    };
  } catch (
    error
  ) {
    return {
      success: false,

      error:
        SignatureVerificationError.MALFORMED_ENVELOPE,

      reason:
        error instanceof Error
          ? error.message
          : "Unknown verification error",
    };
  }
}