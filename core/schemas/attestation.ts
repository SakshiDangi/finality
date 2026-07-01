import { z } from "zod";

import { SignatureSchema } from "./signature";

import {
  IdentifierSchema,
  MetadataSchema,
  RequestStateSchema,
  TimestampSchema,
  VerificationReasonSchema,
} from "./common";

/**
 * ---------------------------------------------------------------------
 * Attestation Result Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * validator decision outcome.
 */

export const AttestationResultSchema = z.enum([
  "APPROVED",
  "REJECTED",
]);

export type AttestationResult = z.infer<
  typeof AttestationResultSchema
>;

/**
 * ---------------------------------------------------------------------
 * Attestation Type Schema
 * ---------------------------------------------------------------------
 *
 * Defines:
 * categories of validator attestations.
 */

export const AttestationTypeSchema = z.enum([
  "REQUEST_VERIFICATION",
  "SETTLEMENT_CONFIRMATION",
  "FINALITY_CONFIRMATION",
  "SYNC_CONFIRMATION",
]);

export type AttestationType = z.infer<
  typeof AttestationTypeSchema
>;

/**
 * ---------------------------------------------------------------------
 * Validator Identity Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * validator/node identity.
 */

export const ValidatorSchema = z
  .object({
    /**
     * Unique validator identifier
     */
    validatorId: IdentifierSchema,

    /**
     * string validator name
     */
    name: z.string().min(1),

    /**
     * Validator public key
     */
    publicKey: z.string().min(1),

    /**
     * Optional validator metadata
     */
    metadata: MetadataSchema.optional(),
  })
  .strict();

export type Validator = z.infer<
  typeof ValidatorSchema
>;

/**
 * ---------------------------------------------------------------------
 * Attestation Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 *
 * signed validator approval
 *
 * This defines the:
 *
 * distributed trust boundary
 */

export const AttestationSchema = z
  .object({
    /**
     * Schema version
     */
    version: z.number().int().positive(),

    /**
     * Unique attestation identifier
     */
    attestationId: IdentifierSchema,

    /**
     * Linked request identifier
     */
    requestId: IdentifierSchema,

    /**
     * Linked verification identifier
     */
    verificationId: IdentifierSchema,

    /**
     * Optional settlement identifier
     *
     * Useful for:
     * - finality proofs
     * - settlement confirmations
     */
    settlementId:
      IdentifierSchema.optional(),

    /**
     * Attestation category
     */
    type: AttestationTypeSchema,

    /**
     * Validator identity
     */
    validator: ValidatorSchema,

    /**
     * Current request state
     */
    state: RequestStateSchema,

    /**
     * Attestation decision
     */
    result: AttestationResultSchema,

    /**
     * Whether validator approved request
     */
    approved: z.boolean(),

    /**
     * Optional rejection reason
     */
    reason:
      VerificationReasonSchema
        .nullable()
        .optional(),

    /**
     * Cryptographic signature proof
     */
    signature: SignatureSchema,

    /**
     * Attestation timestamp
     */
    timestamp: TimestampSchema,

    /**
     * Expiration timestamp
     *
     * Prevents stale attestations.
     */
    expiresAt:
      TimestampSchema.optional(),

    /**
     * Replay safety nonce
     */
    nonce: z
      .number()
      .int()
      .nonnegative(),

    /**
     * Whether attestation reached finality
     */
    finalized: z.boolean(),

    /**
     * Optional validator weight
     *
     * Useful later for:
     * - weighted voting
     * - validator consensus
     * - threshold systems
     */
    weight: z
      .number()
      .positive()
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
     * Approval Consistency Validation
     * -------------------------------------------------------------
     */

    if (
      data.approved &&
      data.result !== "APPROVED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "approved attestations must use APPROVED result",
        path: ["result"],
      });
    }

    if (
      !data.approved &&
      data.result !== "REJECTED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "rejected attestations must use REJECTED result",
        path: ["result"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Rejection Reason Validation
     * -------------------------------------------------------------
     */

    if (
      !data.approved &&
      !data.reason
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "reason required for rejected attestations",
        path: ["reason"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Finalized State Validation
     * -------------------------------------------------------------
     */

    if (
      data.finalized &&
      data.state !== "FINALIZED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "finalized attestations must reference FINALIZED state",
        path: ["state"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Expiration Validation
     * -------------------------------------------------------------
     */

    if (
      data.expiresAt &&
      data.expiresAt < data.timestamp
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "expiresAt cannot be earlier than timestamp",
        path: ["expiresAt"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Validator Weight Validation
     * -------------------------------------------------------------
     */

    if (
      data.weight !== undefined &&
      data.weight <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "validator weight must be positive",
        path: ["weight"],
      });
    }
  });

export type Attestation = z.infer<
  typeof AttestationSchema
>;

/**
 * ---------------------------------------------------------------------
 * Safe Attestation Parser
 * ---------------------------------------------------------------------
 */

export function parseAttestation(
  input: unknown
): Attestation {
  return AttestationSchema.parse(input);
}

/**
 * ---------------------------------------------------------------------
 * Safe Attestation Validator
 * ---------------------------------------------------------------------
 */

export function validateAttestation(
  input: unknown
) {
  return AttestationSchema.safeParse(input);
}

/**
 * ---------------------------------------------------------------------
 * Approval Helper
 * ---------------------------------------------------------------------
 */

export function isApproved(
  attestation: Attestation
): boolean {
  return attestation.approved;
}

/**
 * ---------------------------------------------------------------------
 * Finality Helper
 * ---------------------------------------------------------------------
 */

export function isFinalizedAttestation(
  attestation: Attestation
): boolean {
  return attestation.finalized;
}

/**
 * ---------------------------------------------------------------------
 * Expiration Helper
 * ---------------------------------------------------------------------
 */

export function isExpiredAttestation(
  attestation: Attestation,
  now = Date.now()
): boolean {
  if (!attestation.expiresAt) {
    return false;
  }

  return now > attestation.expiresAt;
}

/**
 * ---------------------------------------------------------------------
 * Validator Threshold Helper
 * ---------------------------------------------------------------------
 *
 * Useful later for:
 * - multisig systems
 * - bridge validator consensus
 * - threshold verification
 */

export function calculateTotalWeight(
  attestations: Attestation[]
): number {
  return attestations.reduce(
    (total, attestation) =>
      total + (attestation.weight ?? 1),
    0
  );
}