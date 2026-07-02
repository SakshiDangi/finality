import {
  verifyMessage,
} from "ethers";

import {
  hashKeccak256,
} from "./hash";

import {
  serializeCanonical,
} from "./serialization";

import {
  isValidAddress,
} from "./wallet";

import {
  isValidSignature,
  signPayload,
} from "./sign";

import type {
  VerificationReason,
  VerificationResult,
  SignedPayload,
} from "./types";

import {
  VerificationError,
} from "./errors";

/**
 * ---------------------------------------------------------------------
 * Recover Signer
 * ---------------------------------------------------------------------
 *
 * Recovers:
 * signing address from digest + signature.
 */

export function recoverSigner(
  digest: string,
  signature: string
): string {
  try {
    if (
      !isValidSignature(
        signature
      )
    ) {
      throw new VerificationError(
        "Invalid signature format"
      );
    }

    const recovered =
      verifyMessage(
        Buffer.from(
          digest.slice(2),
          "hex"
        ),
        signature
      );

    if (
      !isValidAddress(
        recovered
      )
    ) {
      throw new VerificationError(
        "Recovered invalid signer"
      );
    }

    return recovered;
  } catch (error) {
    throw new VerificationError(
      `Signer recovery failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Verify Digest Signature
 * ---------------------------------------------------------------------
 */

export function verifyDigestSignature(
  digest: string,
  signature: string,
  expectedSigner: string
): VerificationResult {
  try {
    const recoveredSigner =
      recoverSigner(
        digest,
        signature
      );

    const verified =
      recoveredSigner.toLowerCase() ===
      expectedSigner.toLowerCase();

    return {
      verified,

      reason: verified
        ? "VALID"
        : "INVALID_SIGNER",

      recoveredSigner,

      expectedSigner,

      digest,
    };
  } catch {
    return {
      verified: false,

      reason:
        "SIGNATURE_RECOVERY_FAILED",

      recoveredSigner: null,

      expectedSigner,

      digest,
    };
  }
}

/**
 * ---------------------------------------------------------------------
 * Verify Payload Signature
 * ---------------------------------------------------------------------
 *
 * Full deterministic verification flow.
 */

export function verifyPayload(
  payload: unknown,
  signedPayload: SignedPayload
): VerificationResult {
  try {
    /**
     * -------------------------------------------------------------
     * Recompute Canonical Serialization
     * -------------------------------------------------------------
     */

    const serialized =
      serializeCanonical(
        payload
      );

    /**
     * -------------------------------------------------------------
     * Recompute Deterministic Digest
     * -------------------------------------------------------------
     */

    const digest =
      hashKeccak256(payload);

    /**
     * -------------------------------------------------------------
     * Validate Digest Integrity
     * -------------------------------------------------------------
     */

    if (
      digest !==
      signedPayload.digest
    ) {
      return {
        verified: false,

        reason:
          "INVALID_DIGEST",

        recoveredSigner:
          null,

        expectedSigner:
          signedPayload.signer,

        digest,
      };
    }

    /**
     * -------------------------------------------------------------
     * Validate Canonical Serialization
     * -------------------------------------------------------------
     */

    if (
      serialized !==
      signedPayload.serialized
    ) {
      return {
        verified: false,

        reason:
          "INVALID_PAYLOAD",

        recoveredSigner:
          null,

        expectedSigner:
          signedPayload.signer,

        digest,
      };
    }

    /**
     * -------------------------------------------------------------
     * Verify Signature
     * -------------------------------------------------------------
     */

    return verifyDigestSignature(
      digest,
      signedPayload.signature,
      signedPayload.signer
    );
  } catch {
    return {
      verified: false,

      reason:
        "INVALID_PAYLOAD",

      recoveredSigner:
        null,

      expectedSigner:
        signedPayload.signer,

      digest: null,
    };
  }
}

/**
 * ---------------------------------------------------------------------
 * Strict Verification Assertion
 * ---------------------------------------------------------------------
 *
 * Throws:
 * on failed verification.
 */

export function assertVerified(
  result: VerificationResult
): void {
  if (!result.verified) {
    throw new VerificationError(
      `Verification failed: ${result.reason}`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Verification Equality
 * ---------------------------------------------------------------------
 */

export function verificationMatches(
  a: VerificationResult,
  b: VerificationResult
): boolean {
  return (
    a.verified ===
      b.verified &&
    a.reason === b.reason &&
    a.digest === b.digest &&
    a.recoveredSigner?.toLowerCase() ===
      b.recoveredSigner?.toLowerCase()
  );
}