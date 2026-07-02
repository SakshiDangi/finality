import {
  verifyPayload,
} from "@/core/crypto";

import type {
  SignedPayload,
  VerificationReason,
} from "@/core/crypto";

import type {
  ValidationResult,
} from "./types";

import {
  SignatureValidationError,
} from "./errors";

/**
 * ---------------------------------------------------------------------
 * Signature Validation Input
 * ---------------------------------------------------------------------
 */

export interface SignatureValidationInput {
  /**
   * -------------------------------------------------------------
   * Original Protocol Payload
   * -------------------------------------------------------------
   */

  payload: unknown;

  /**
   * -------------------------------------------------------------
   * Signed Payload Metadata
   * -------------------------------------------------------------
   */

  signedPayload: SignedPayload;

  /**
   * -------------------------------------------------------------
   * Expected Authorized Signer
   * -------------------------------------------------------------
   */

  expectedSigner: string;
}

/**
 * ---------------------------------------------------------------------
 * Signature Validation Options
 * ---------------------------------------------------------------------
 */

export interface SignatureValidationOptions {
  /**
   * -------------------------------------------------------------
   * Override Current Time
   * -------------------------------------------------------------
   *
   * Useful for:
   * - deterministic tests
   * - protocol simulations
   */

  now?: number;
}

/**
 * ---------------------------------------------------------------------
 * Verification Reason Mapping
 * ---------------------------------------------------------------------
 *
 * Maps low-level crypto verification failures
 * into signature validation failures.
 */

function toSignatureValidationReason(
  reason: VerificationReason
):
  | "INVALID_SIGNATURE"
  | "INVALID_SIGNER"
  | "SIGNATURE_RECOVERY_FAILED" {
  switch (reason) {
    case "INVALID_SIGNER":
      return "INVALID_SIGNER";

    case "SIGNATURE_RECOVERY_FAILED":
      return "SIGNATURE_RECOVERY_FAILED";

    case "INVALID_SIGNATURE":
    case "INVALID_DIGEST":
    case "INVALID_PAYLOAD":
    default:
      return "INVALID_SIGNATURE";
  }
}

/**
 * ---------------------------------------------------------------------
 * Validate Signature
 * ---------------------------------------------------------------------
 *
 * Enforces:
 * - cryptographic validity
 * - signer authorization
 * - payload integrity
 */

export function validateSignature(
  input: SignatureValidationInput,
  options: SignatureValidationOptions = {}
): ValidationResult {
  const {
    payload,
    signedPayload,
    expectedSigner,
  } = input;

  const now =
    options.now ??
    Date.now();

  /**
   * -------------------------------------------------------------
   * Signature Presence Validation
   * -------------------------------------------------------------
   */

  if (!signedPayload.signature) {
    throw new SignatureValidationError(
      "MISSING_SIGNATURE",
      "Missing request signature"
    );
  }

  /**
   * -------------------------------------------------------------
   * Expected Signer Validation
   * -------------------------------------------------------------
   */

  if (!expectedSigner) {
    throw new SignatureValidationError(
      "INVALID_SIGNER",
      "Expected signer is required"
    );
  }

  /**
   * -------------------------------------------------------------
   * Cryptographic Verification
   * -------------------------------------------------------------
   */

  const verification =
    verifyPayload(
      payload,
      signedPayload
    );

  /**
   * -------------------------------------------------------------
   * Verification Failure
   * -------------------------------------------------------------
   */

  if (!verification.verified) {
    throw new SignatureValidationError(
      toSignatureValidationReason(
        verification.reason
      ),
      `Signature verification failed: ${verification.reason}`
    );
  }

  /**
   * -------------------------------------------------------------
   * Recovered Signer Validation
   * -------------------------------------------------------------
   */

  const recoveredSigner =
    verification.recoveredSigner;

  if (!recoveredSigner) {
    throw new SignatureValidationError(
      "SIGNATURE_RECOVERY_FAILED",
      "Failed to recover signer"
    );
  }

  /**
   * -------------------------------------------------------------
   * Signer Authorization
   * -------------------------------------------------------------
   */

  if (
    recoveredSigner.toLowerCase() !==
    expectedSigner.toLowerCase()
  ) {
    throw new SignatureValidationError(
      "INVALID_SIGNER",
      `Recovered signer ${recoveredSigner} does not match expected signer ${expectedSigner}`
    );
  }

  /**
   * -------------------------------------------------------------
   * Validation Success
   * -------------------------------------------------------------
   */

  return {
    valid: true,

    reason: "VALID",

    stage: "SIGNATURE",

    severity: "INFO",

    validatedAt: now,

    message:
      "Signature validation succeeded",
  };
}

/**
 * ---------------------------------------------------------------------
 * Lightweight Signature Check
 * ---------------------------------------------------------------------
 *
 * Returns:
 * boolean authorization decision.
 */

export function isValidSignature(
  input: SignatureValidationInput,
  options: SignatureValidationOptions = {}
): boolean {
  try {
    return validateSignature(
      input,
      options
    ).valid;
  } catch {
    return false;
  }
}