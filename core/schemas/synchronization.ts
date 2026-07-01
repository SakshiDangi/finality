import { z } from "zod";

import { SignatureSchema } from "./signature";

import {
  IdentifierSchema,
  MetadataSchema,
  RequestStateSchema,
  TimestampSchema,
} from "./common";

/**
 * ---------------------------------------------------------------------
 * Synchronization Status Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * node synchronization state.
 */

export const SynchronizationStatusSchema =
  z.enum([
    "SYNCING",
    "IN_SYNC",
    "OUT_OF_SYNC",
    "RECOVERING",
  ]);

export type SynchronizationStatus =
  z.infer<
    typeof SynchronizationStatusSchema
  >;

/**
 * ---------------------------------------------------------------------
 * Synchronization Type Schema
 * ---------------------------------------------------------------------
 *
 * Defines:
 * synchronization operation category.
 */

export const SynchronizationTypeSchema =
  z.enum([
    "STATE_SYNC",
    "REPLAY_SYNC",
    "SETTLEMENT_SYNC",
    "REQUEST_SYNC",
    "FULL_SYNC",
  ]);

export type SynchronizationType =
  z.infer<
    typeof SynchronizationTypeSchema
  >;

/**
 * ---------------------------------------------------------------------
 * Settlement Checkpoint Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * known settlement progress.
 */

export const SettlementCheckpointSchema =
  z
    .object({
      /**
       * Request identifier
       */
      requestId: IdentifierSchema,

      /**
       * Known settlement state
       */
      state: RequestStateSchema,

      /**
       * Settlement timestamp
       */
      updatedAt: TimestampSchema,
    })
    .strict();

export type SettlementCheckpoint =
  z.infer<
    typeof SettlementCheckpointSchema
  >;

/**
 * ---------------------------------------------------------------------
 * Replay Synchronization Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * replay tracking synchronization.
 */

export const ReplaySynchronizationSchema =
  z
    .object({
      /**
       * Sender identity
       */
      sender: IdentifierSchema,

      /**
       * Latest known nonce
       */
      latestNonce: z
        .number()
        .int()
        .nonnegative(),

      /**
       * Last synchronization timestamp
       */
      synchronizedAt: TimestampSchema,
    })
    .strict();

export type ReplaySynchronization =
  z.infer<
    typeof ReplaySynchronizationSchema
  >;

/**
 * ---------------------------------------------------------------------
 * Synchronization Message Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 *
 * distributed node reconciliation
 *
 * This defines:
 *
 * distributed consistency boundary
 */

export const SynchronizationSchema = z
  .object({
    /**
     * Schema version
     */
    version: z.number().int().positive(),

    /**
     * Unique synchronization identifier
     */
    syncId: IdentifierSchema,

    /**
     * Synchronization category
     */
    type: SynchronizationTypeSchema,

    /**
     * Synchronizing node identity
     */
    nodeId: IdentifierSchema,

    /**
     * Current synchronization status
     */
    status:
      SynchronizationStatusSchema,

    /**
     * Known request identifiers
     */
    knownRequests: z.array(
      IdentifierSchema
    ),

    /**
     * Settlement checkpoints
     */
    settlements: z.array(
      SettlementCheckpointSchema
    ),

    /**
     * Replay synchronization state
     */
    replayState: z.array(
      ReplaySynchronizationSchema
    ),

    /**
     * Missing request identifiers
     *
     * Used for:
     * - reconciliation
     * - recovery
     * - missing packet fetch
     */
    missingRequests: z.array(
      IdentifierSchema
    ),

    /**
     * Latest synchronized block/sequence
     *
     * Useful later for:
     * - chain indexing
     * - validator coordination
     * - ordered replay protection
     */
    latestSequence: z
      .number()
      .int()
      .nonnegative(),

    /**
     * Synchronization timestamp
     */
    timestamp: TimestampSchema,

    /**
     * Optional synchronization expiration
     */
    expiresAt:
      TimestampSchema.optional(),

    /**
     * Whether synchronization completed
     */
    completed: z.boolean(),

    /**
     * Optional synchronization errors
     */
    errors: z.array(
      z.string().min(1)
    ).optional(),

    /**
     * Synchronization proof signature
     */
    signature:
      SignatureSchema.optional(),

    /**
     * Optional metadata
     */
    metadata: MetadataSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    /**
     * -------------------------------------------------------------
     * Completion Validation
     * -------------------------------------------------------------
     */

    if (
      data.completed &&
      data.status !== "IN_SYNC"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Completed synchronization must be IN_SYNC",
        path: ["status"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Recovery Validation
     * -------------------------------------------------------------
     */

    if (
      data.status === "RECOVERING" &&
      data.missingRequests.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "RECOVERING state requires missing requests",
        path: ["missingRequests"],
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
     * Sequence Validation
     * -------------------------------------------------------------
     */

    if (data.latestSequence < 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "latestSequence cannot be negative",
        path: ["latestSequence"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Duplicate Request Validation
     * -------------------------------------------------------------
     */

    const uniqueRequests =
      new Set(data.knownRequests);

    if (
      uniqueRequests.size !==
      data.knownRequests.length
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Duplicate request identifiers detected",
        path: ["knownRequests"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Replay State Validation
     * -------------------------------------------------------------
     */

    const replaySenders = new Set();

    for (const replay of data.replayState) {
      if (
        replaySenders.has(replay.sender)
      ) {
        ctx.addIssue({
          code: "custom",
          message:
            "Duplicate replay sender detected",
          path: ["replayState"],
        });
      }

      replaySenders.add(replay.sender);
    }
  });

export type Synchronization = z.infer<
  typeof SynchronizationSchema
>;

/**
 * ---------------------------------------------------------------------
 * Safe Synchronization Parser
 * ---------------------------------------------------------------------
 */

export function parseSynchronization(
  input: unknown
): Synchronization {
  return SynchronizationSchema.parse(
    input
  );
}

/**
 * ---------------------------------------------------------------------
 * Safe Synchronization Validator
 * ---------------------------------------------------------------------
 */

export function validateSynchronization(
  input: unknown
) {
  return SynchronizationSchema.safeParse(
    input
  );
}

/**
 * ---------------------------------------------------------------------
 * Synchronization Completion Helper
 * ---------------------------------------------------------------------
 */

export function isSynchronizationComplete(
  sync: Synchronization
): boolean {
  return sync.completed;
}

/**
 * ---------------------------------------------------------------------
 * Recovery State Helper
 * ---------------------------------------------------------------------
 */

export function requiresRecovery(
  sync: Synchronization
): boolean {
  return (
    sync.status === "RECOVERING"
  );
}

/**
 * ---------------------------------------------------------------------
 * Synchronization Expiration Helper
 * ---------------------------------------------------------------------
 */

export function isSynchronizationExpired(
  sync: Synchronization,
  now = Date.now()
): boolean {
  if (!sync.expiresAt) {
    return false;
  }

  return now > sync.expiresAt;
}

/**
 * ---------------------------------------------------------------------
 * Missing Request Helper
 * ---------------------------------------------------------------------
 */

export function hasMissingRequests(
  sync: Synchronization
): boolean {
  return (
    sync.missingRequests.length > 0
  );
}

/**
 * ---------------------------------------------------------------------
 * Replay Nonce Helper
 * ---------------------------------------------------------------------
 */

export function getLatestNonceForSender(
  sync: Synchronization,
  sender: string
): number | null {
  const replay =
    sync.replayState.find(
      (entry) =>
        entry.sender === sender
    );

  return replay
    ? replay.latestNonce
    : null;
}