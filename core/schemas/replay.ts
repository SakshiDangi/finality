import { z } from "zod";

import {
  IdentifierSchema,
  MetadataSchema,
  TimestampSchema,
} from "./common";

/**
 * ---------------------------------------------------------------------
 * Replay Status Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * replay tracking lifecycle state.
 */

export const ReplayStatusSchema = z.enum([
  "PENDING",
  "PROCESSED",
  "REJECTED",
  "EXPIRED",
]);

export type ReplayStatus = z.infer<
  typeof ReplayStatusSchema
>;

/**
 * ---------------------------------------------------------------------
 * Replay Decision Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * replay validation outcome.
 */

export const ReplayDecisionSchema = z.enum([
  "ACCEPTED",
  "REPLAY_DETECTED",
  "NONCE_TOO_OLD",
  "NONCE_OUT_OF_ORDER",
]);

export type ReplayDecision = z.infer<
  typeof ReplayDecisionSchema
>;

/**
 * ---------------------------------------------------------------------
 * Nonce Window Schema
 * ---------------------------------------------------------------------
 *
 * Useful later for:
 * - unordered execution
 * - bridge relayers
 * - packet buffering
 */

export const NonceWindowSchema = z
  .object({
    /**
     * Lowest accepted nonce
     */
    minNonce: z
      .number()
      .int()
      .nonnegative(),

    /**
     * Highest accepted nonce
     */
    maxNonce: z
      .number()
      .int()
      .nonnegative(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.maxNonce < data.minNonce
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "maxNonce cannot be smaller than minNonce",
        path: ["maxNonce"],
      });
    }
  });

export type NonceWindow = z.infer<
  typeof NonceWindowSchema
>;

/**
 * ---------------------------------------------------------------------
 * Replay Record Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 *
 * replay protection state
 *
 * This defines:
 *
 * replay security boundary
 */

export const ReplayRecordSchema = z
  .object({
    /**
     * Schema version
     */
    version: z.number().int().positive(),

    /**
     * Unique replay record identifier
     */
    replayId: IdentifierSchema,

    /**
     * Linked request identifier
     */
    requestId: IdentifierSchema,

    /**
     * Sender identity
     */
    sender: IdentifierSchema,

    /**
     * Current nonce
     */
    nonce: z
      .number()
      .int()
      .nonnegative(),

    /**
     * Latest known nonce
     *
     * Used for:
     * - replay ordering
     * - synchronization
     */
    latestKnownNonce: z
      .number()
      .int()
      .nonnegative(),

    /**
     * Replay validation decision
     */
    decision:
      ReplayDecisionSchema,

    /**
     * Replay lifecycle status
     */
    status: ReplayStatusSchema,

    /**
     * Whether request already processed
     */
    processed: z.boolean(),

    /**
     * Whether replay attack detected
     */
    replayDetected: z.boolean(),

    /**
     * Nonce acceptance window
     */
    nonceWindow:
      NonceWindowSchema,

    /**
     * Replay tracking timestamp
     */
    timestamp: TimestampSchema,

    /**
     * Processing completion timestamp
     */
    processedAt:
      TimestampSchema
        .nullable()
        .optional(),

    /**
     * Replay record expiration
     *
     * Prevents:
     * - infinite replay storage
     * - stale replay tracking
     */
    expiresAt:
      TimestampSchema.optional(),

    /**
     * Optional synchronization source
     *
     * Useful for:
     * - distributed replay sync
     * - validator reconciliation
     */
    synchronizedFrom:
      IdentifierSchema.optional(),

    /**
     * Optional metadata
     */
    metadata: MetadataSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    /**
     * -------------------------------------------------------------
     * Replay Detection Validation
     * -------------------------------------------------------------
     */

    if (
      data.replayDetected &&
      data.decision !==
        "REPLAY_DETECTED"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Replay detection requires REPLAY_DETECTED decision",
        path: ["decision"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Processed Validation
     * -------------------------------------------------------------
     */

    if (
      data.processed &&
      !data.processedAt
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "processedAt required when processed is true",
        path: ["processedAt"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Nonce Ordering Validation
     * -------------------------------------------------------------
     */

    if (
      data.nonce <
      data.nonceWindow.minNonce
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "nonce below accepted window",
        path: ["nonce"],
      });
    }

    if (
      data.nonce >
      data.nonceWindow.maxNonce
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "nonce exceeds accepted window",
        path: ["nonce"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Latest Nonce Validation
     * -------------------------------------------------------------
     */

    if (
      data.latestKnownNonce <
      data.nonce
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "latestKnownNonce cannot be smaller than nonce",
        path: ["latestKnownNonce"],
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
     * Processed Timestamp Validation
     * -------------------------------------------------------------
     */

    if (
      data.processedAt &&
      data.processedAt <
        data.timestamp
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "processedAt cannot be earlier than timestamp",
        path: ["processedAt"],
      });
    }
  });

export type ReplayRecord = z.infer<
  typeof ReplayRecordSchema
>;

/**
 * ---------------------------------------------------------------------
 * Safe Replay Parser
 * ---------------------------------------------------------------------
 */

export function parseReplayRecord(
  input: unknown
): ReplayRecord {
  return ReplayRecordSchema.parse(
    input
  );
}

/**
 * ---------------------------------------------------------------------
 * Safe Replay Validator
 * ---------------------------------------------------------------------
 */

export function validateReplayRecord(
  input: unknown
) {
  return ReplayRecordSchema.safeParse(
    input
  );
}

/**
 * ---------------------------------------------------------------------
 * Replay Detection Helper
 * ---------------------------------------------------------------------
 */

export function isReplayDetected(
  replay: ReplayRecord
): boolean {
  return replay.replayDetected;
}

/**
 * ---------------------------------------------------------------------
 * Replay Processing Helper
 * ---------------------------------------------------------------------
 */

export function isProcessedReplay(
  replay: ReplayRecord
): boolean {
  return replay.processed;
}

/**
 * ---------------------------------------------------------------------
 * Replay Expiration Helper
 * ---------------------------------------------------------------------
 */

export function isReplayExpired(
  replay: ReplayRecord,
  now = Date.now()
): boolean {
  if (!replay.expiresAt) {
    return false;
  }

  return now > replay.expiresAt;
}

/**
 * ---------------------------------------------------------------------
 * Nonce Validation Helper
 * ---------------------------------------------------------------------
 */

export function isValidNextNonce(
  latestNonce: number,
  incomingNonce: number
): boolean {
  return incomingNonce === latestNonce + 1;
}

/**
 * ---------------------------------------------------------------------
 * Replay Window Helper
 * ---------------------------------------------------------------------
 */

export function isNonceWithinWindow(
  nonce: number,
  window: NonceWindow
): boolean {
  return (
    nonce >= window.minNonce &&
    nonce <= window.maxNonce
  );
}