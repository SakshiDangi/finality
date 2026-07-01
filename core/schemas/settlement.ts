import { z } from "zod";

import {
  IdentifierSchema,
  MetadataSchema,
  RequestStateSchema,
  TimestampSchema,
  VerificationReasonSchema,
} from "./common";

/**
 * ---------------------------------------------------------------------
 * Settlement Transition Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * valid protocol state transitions
 *
 * VERY IMPORTANT:
 *
 * Protocols MUST strictly control:
 *
 * - which states are reachable
 * - which transitions are valid
 * - finality guarantees
 */

export const SettlementTransitionSchema = z.enum([
  "CREATED_TO_VERIFIED",
  "VERIFIED_TO_FINALIZED",
  "CREATED_TO_REJECTED",
  "VERIFIED_TO_REJECTED",
]);

export type SettlementTransition = z.infer<
  typeof SettlementTransitionSchema
>;

/**
 * ---------------------------------------------------------------------
 * Settlement Finality Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * whether protocol state is immutable.
 *
 * Finalized settlements should NEVER mutate again.
 */

export const FinalityStatusSchema = z.enum([
  "PENDING",
  "FINALIZED",
]);

export type FinalityStatus = z.infer<
  typeof FinalityStatusSchema
>;

/**
 * ---------------------------------------------------------------------
 * Settlement Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 *
 * canonical protocol truth
 *
 * This is the authoritative state machine output.
 */

export const SettlementSchema = z
  .object({
    /**
     * Schema version
     */
    version: z.number().int().positive(),

    /**
     * Unique settlement identifier
     */
    settlementId: IdentifierSchema,

    /**
     * Linked request identifier
     */
    requestId: IdentifierSchema,

    /**
     * Current protocol state
     */
    state: RequestStateSchema,

    /**
     * Previous protocol state
     *
     * Useful for:
     * - audit trails
     * - synchronization
     * - deterministic transitions
     */
    previousState: RequestStateSchema.optional(),

    /**
     * Transition performed
     */
    transition: SettlementTransitionSchema,

    /**
     * Whether settlement reached immutable finality
     */
    finality: FinalityStatusSchema,

    /**
     * Indicates if settlement is terminal
     *
     * Terminal states:
     * - FINALIZED
     * - REJECTED
     */
    terminal: z.boolean(),

    /**
     * Settlement creation timestamp
     */
    createdAt: TimestampSchema,

    /**
     * Last updated timestamp
     */
    updatedAt: TimestampSchema,

    /**
     * Finalization timestamp
     *
     * Null until finalized.
     */
    finalizedAt: TimestampSchema
      .nullable()
      .optional(),

    /**
     * Node/validator responsible
     * for settlement transition
     */
    settledBy: IdentifierSchema,

    /**
     * Verification result linkage
     *
     * Connects:
     * verification layer
     * → settlement layer
     */
    verificationId: IdentifierSchema.optional(),

    /**
     * Optional rejection reason
     *
     * Required if state == REJECTED
     */
    rejectionReason:
      VerificationReasonSchema.optional(),

    /**
     * Replay safety marker
     *
     * Prevents duplicate settlement execution.
     */
    executed: z.boolean(),

    /**
     * Optional metadata
     */
    metadata: MetadataSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    /**
     * -------------------------------------------------------------
     * Finality Validation
     * -------------------------------------------------------------
     */

    if (
      data.finality === "FINALIZED" &&
      !data.finalizedAt
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "finalizedAt required when finality is FINALIZED",
        path: ["finalizedAt"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Terminal State Validation
     * -------------------------------------------------------------
     */

    const terminalStates = [
      "FINALIZED",
      "REJECTED",
    ];

    if (
      terminalStates.includes(data.state) &&
      !data.terminal
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "terminal must be true for terminal states",
        path: ["terminal"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Rejection Validation
     * -------------------------------------------------------------
     */

    if (
      data.state === "REJECTED" &&
      !data.rejectionReason
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "rejectionReason required for REJECTED state",
        path: ["rejectionReason"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Transition Validation
     * -------------------------------------------------------------
     */

    const validTransitions = {
      CREATED_TO_VERIFIED: {
        previous: "CREATED",
        current: "VERIFIED",
      },

      VERIFIED_TO_FINALIZED: {
        previous: "VERIFIED",
        current: "FINALIZED",
      },

      CREATED_TO_REJECTED: {
        previous: "CREATED",
        current: "REJECTED",
      },

      VERIFIED_TO_REJECTED: {
        previous: "VERIFIED",
        current: "REJECTED",
      },
    };

    const transition =
      validTransitions[data.transition];

    if (
      transition &&
      data.previousState !== transition.previous
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Invalid previousState for transition",
        path: ["previousState"],
      });
    }

    if (
      transition &&
      data.state !== transition.current
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Invalid target state for transition",
        path: ["state"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Timestamp Validation
     * -------------------------------------------------------------
     */

    if (data.updatedAt < data.createdAt) {
      ctx.addIssue({
        code: "custom",
        message:
          "updatedAt cannot be earlier than createdAt",
        path: ["updatedAt"],
      });
    }

    if (
      data.finalizedAt &&
      data.finalizedAt < data.createdAt
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "finalizedAt cannot be earlier than createdAt",
        path: ["finalizedAt"],
      });
    }
  });

export type Settlement = z.infer<
  typeof SettlementSchema
>;

/**
 * ---------------------------------------------------------------------
 * Safe Settlement Parser
 * ---------------------------------------------------------------------
 */

export function parseSettlement(
  input: unknown
): Settlement {
  return SettlementSchema.parse(input);
}

/**
 * ---------------------------------------------------------------------
 * Safe Settlement Validator
 * ---------------------------------------------------------------------
 */

export function validateSettlement(
  input: unknown
) {
  return SettlementSchema.safeParse(input);
}

/**
 * ---------------------------------------------------------------------
 * Finality Helper
 * ---------------------------------------------------------------------
 */

export function isFinalized(
  settlement: Settlement
): boolean {
  return (
    settlement.finality === "FINALIZED"
  );
}

/**
 * ---------------------------------------------------------------------
 * Terminal State Helper
 * ---------------------------------------------------------------------
 */

export function isTerminalState(
  settlement: Settlement
): boolean {
  return settlement.terminal;
}

/**
 * ---------------------------------------------------------------------
 * Valid Transition Helper
 * ---------------------------------------------------------------------
 */

export function canTransition(
  current: z.infer<typeof RequestStateSchema>,
  next: z.infer<typeof RequestStateSchema>
): boolean {
  const transitions: Record<
    string,
    string[]
  > = {
    CREATED: ["VERIFIED", "REJECTED"],

    VERIFIED: ["FINALIZED", "REJECTED"],

    FINALIZED: [],

    REJECTED: [],
  };

  return (
    transitions[current]?.includes(next) ??
    false
  );
}