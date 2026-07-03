import {
  Envelope,
} from "../base/envelope.js";

import {
  canonicalizeEnvelope,
} from "../crypto/canonical.js";

import {
  deriveAddress,
  PublicKey,
} from "../crypto/identity.js";

import {
  protocolHash,
} from "../crypto/hashing.js";

import {
  Signature,
  verifyPayloadSignature,
} from "../crypto/signatures.js";

/* =========================================
 * VERIFICATION ERROR CODES
 * =======================================*/

export enum SignatureVerificationError {
  SIGNATURE_MISSING =
    "SIGNATURE_MISSING",

  INVALID_SIGNATURE =
    "INVALID_SIGNATURE",

  INVALID_SENDER =
    "INVALID_SENDER",

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
  envelope: Envelope,
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
  envelope: Envelope,
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
  publicKey: PublicKey,
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

    /**
     * Verify cryptographic signature.
     */
    const isValidSignature =
      verifyPayloadSignature(
        createSigningPayload(
          envelope,
        ),

        envelope.signature as Signature,

        publicKey,
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

        digest:
          createSigningDigest(
            envelope,
          ),
      };
    }

    /**
     * Derive protocol address
     * from public key.
     */
    const derivedAddress =
      deriveAddress(
        publicKey,
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
          SignatureVerificationError.INVALID_SENDER,

        reason:
          "Envelope sender does not match signer identity",

        digest:
          createSigningDigest(
            envelope,
          ),
      };
    }

    /**
     * Successful verification.
     */
    return {
      success: true,

      digest:
        createSigningDigest(
          envelope,
        ),
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