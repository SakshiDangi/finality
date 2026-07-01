import { z } from "zod";

import {
  IdentifierSchema,
  MetadataSchema,
  RequestStateSchema,
  TimestampSchema,
  VerificationReasonSchema,
  VerificationStatusSchema,
} from "./common";

/**
 * ---------------------------------------------------------------------
 * Verification Check Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * individual validation checks.
 *
 * Useful for:
 * - debugging
 * - audit logs
 * - validator transparency
 * - protocol tracing
 */

export const VerificationCheckSchema = z
  .object({
    /**
     * Name of verification check
     *
     * Examples:
     * - SIGNATURE_VALID
     * - NONCE_VALID
     * - TIMESTAMP_FRESH
     */
    check: z.string().min(1),

    /**
     * Whether check passed
     */
    passed: z.boolean(),

    /**
     * Optional failure reason
     */
    reason:
      VerificationReasonSchema.optional(),

    /**
     * Optional metadata
     */
    metadata: MetadataSchema.optional(),
  })
  .strict();

export type VerificationCheck = z.infer<
  typeof VerificationCheckSchema
>;

/**
 * ---------------------------------------------------------------------
 * Verification Result Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 *
 * deterministic validation decision
 *
 * This schema defines:
 *
 * protocol verification truth
 */

export const VerificationSchema = z
  .object({
    /**
     * Schema version
     */
    version: z.number().int().positive(),

    /**
     * Unique verification identifier
     */
    verificationId: IdentifierSchema,

    /**
     * Linked request identifier
     */
    requestId: IdentifierSchema,

    /**
     * Node/validator performing verification
     */
    verifier: IdentifierSchema,

    /**
     * Overall verification status
     */
    status: VerificationStatusSchema,

    /**
     * Whether request passed validation
     */
    verified: z.boolean(),

    /**
     * Current request state
     *
     * Usually:
     * CREATED
     * VERIFIED
     * REJECTED
     */
    state: RequestStateSchema,

    /**
     * Individual validation checks
     */
    checks: z
      .array(VerificationCheckSchema)
      .min(1),

    /**
     * Deterministic rejection reason
     *
     * Required if verification fails.
     */
    reason:
      VerificationReasonSchema
        .nullable()
        .optional(),

    /**
     * Cryptographic signature validity
     */
    signatureValid: z.boolean(),

    /**
     * Replay protection result
     */
    replayProtected: z.boolean(),

    /**
     * Timestamp freshness result
     */
    timestampFresh: z.boolean(),

    /**
     * Authorization result
     */
    authorizedSender: z.boolean(),

    /**
     * Whether payload passed validation
     */
    payloadValid: z.boolean(),

    /**
     * Settlement transition validity
     */
    transitionValid: z.boolean(),

    /**
     * Verification timestamp
     */
    verifiedAt: TimestampSchema,

    /**
     * Optional request processing duration
     *
     * Useful for:
     * - metrics
     * - performance monitoring
     */
    processingTimeMs: z
      .number()
      .nonnegative()
      .optional(),

    /**
     * Optional metadata
     */
    metadata: MetadataSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    /**
     * -------------------------------------------------------------
     * Verified State Validation
     * -------------------------------------------------------------
     */

    if (
      data.verified &&
      data.status !== "VERIFIED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "status must be VERIFIED when verified is true",
        path: ["status"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Rejected State Validation
     * -------------------------------------------------------------
     */

    if (
      !data.verified &&
      data.status !== "REJECTED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "status must be REJECTED when verified is false",
        path: ["status"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Failure Reason Validation
     * -------------------------------------------------------------
     */

    if (
      !data.verified &&
      !data.reason
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "reason required when verification fails",
        path: ["reason"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Successful Verification Rules
     * -------------------------------------------------------------
     */

    if (data.verified) {
      const checks = [
        data.signatureValid,
        data.replayProtected,
        data.timestampFresh,
        data.authorizedSender,
        data.payloadValid,
        data.transitionValid,
      ];

      const allPassed = checks.every(Boolean);

      if (!allPassed) {
        ctx.addIssue({
          code: "custom",
          message:
            "all verification checks must pass for verified requests",
        });
      }
    }

    /**
     * -------------------------------------------------------------
     * State Validation
     * -------------------------------------------------------------
     */

    if (
      data.verified &&
      data.state !== "VERIFIED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "verified requests must enter VERIFIED state",
        path: ["state"],
      });
    }

    if (
      !data.verified &&
      data.state !== "REJECTED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "failed verification must enter REJECTED state",
        path: ["state"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Check Consistency Validation
     * -------------------------------------------------------------
     */

    const failedChecks =
      data.checks.filter(
        (check) => !check.passed
      );

    if (
      data.verified &&
      failedChecks.length > 0
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "verified requests cannot contain failed checks",
        path: ["checks"],
      });
    }
  });

export type Verification = z.infer<
  typeof VerificationSchema
>;

/**
 * ---------------------------------------------------------------------
 * Safe Verification Parser
 * ---------------------------------------------------------------------
 */

export function parseVerification(
  input: unknown
): Verification {
  return VerificationSchema.parse(input);
}

/**
 * ---------------------------------------------------------------------
 * Safe Verification Validator
 * ---------------------------------------------------------------------
 */

export function validateVerification(
  input: unknown
) {
  return VerificationSchema.safeParse(input);
}

/**
 * ---------------------------------------------------------------------
 * Verification Success Helper
 * ---------------------------------------------------------------------
 */

export function isVerified(
  verification: Verification
): boolean {
  return verification.verified;
}

/**
 * ---------------------------------------------------------------------
 * Verification Failure Helper
 * ---------------------------------------------------------------------
 */

export function isRejected(
  verification: Verification
): boolean {
  return (
    verification.status === "REJECTED"
  );
}

/**
 * ---------------------------------------------------------------------
 * Verification Check Helper
 * ---------------------------------------------------------------------
 */

export function getFailedChecks(
  verification: Verification
): VerificationCheck[] {
  return verification.checks.filter(
    (check) => !check.passed
  );
}

/**
 * ---------------------------------------------------------------------
 * Verification Integrity Helper
 * ---------------------------------------------------------------------
 */

export function hasPassedAllChecks(
  verification: Verification
): boolean {
  return [
    verification.signatureValid,
    verification.replayProtected,
    verification.timestampFresh,
    verification.authorizedSender,
    verification.payloadValid,
    verification.transitionValid,
  ].every(Boolean);
}