import { z } from "zod";
import { SignatureSchema } from "./signature";

/**
 * ---------------------------------------------------------------------
 * Request Actions
 * ---------------------------------------------------------------------
 *
 * Defines allowed protocol operations.
 *
 * NEVER allow arbitrary action strings.
 *
 * This enum defines the protocol intent surface.
 */

export const RequestActionSchema = z.enum([
  "VERIFY",
  "SETTLE",
  "ATTEST",
  "SYNC",
]);

export type RequestAction = z.infer<
  typeof RequestActionSchema
>;

/**
 * ---------------------------------------------------------------------
 * Request Status
 * ---------------------------------------------------------------------
 *
 * Represents request lifecycle state.
 */

export const RequestStatusSchema = z.enum([
  "CREATED",
  "VERIFIED",
  "FINALIZED",
  "REJECTED",
]);

export type RequestStatus = z.infer<
  typeof RequestStatusSchema
>;

/**
 * ---------------------------------------------------------------------
 * Request Payload Schema
 * ---------------------------------------------------------------------

 * Payloads define:
 * - requested state transition
 * - operation semantics
 * - verification targets
 */

export const RequestPayloadSchema = z
  .object({
    /**
     * Protocol action type
     */
    action: RequestActionSchema,

    /**
     * Arbitrary request data
     *
     * Future examples:
     * - settlement data
     * - attestation targets
     * - bridge transfer payloads
     * - synchronization payloads
     */
    data: z.record(z.string(), z.any()),

    /**
     * Optional target chain for later (bridges):
     * - bridges
     * - multi-chain systems
     * - settlement routing
     */
    targetChain: z.string().min(1).optional(),

    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export type RequestPayload = z.infer<
  typeof RequestPayloadSchema
>;

/**
 * ---------------------------------------------------------------------
 * Main Request Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 *
 * "A signed request for protocol state transition"
 * This schema defines: protocol intent trust boundary
 */

export const RequestSchema = z
  .object({
    /**
     * Schema version
     *
     * Enables:
     * - protocol upgrades
     * - backward compatibility
     * - migration support
     */
    version: z.number().int().positive(),

    /**
     * Deterministic request identity
     *
     * Eventually derived from:
     * hash(canonical_request_bytes)
     */
    requestId: z.string().min(1),

    /**
     * Request creator identity
     *
     * Examples:
     * - wallet address
     * - validator node
     * - relayer
     */
    sender: z.string().min(1),

    /**
     * Core protocol intent
     */
    payload: RequestPayloadSchema,

    /**
     * Replay protection nonce
     *
     * MUST monotonically increase per sender.
     */
    nonce: z.number().int().nonnegative(),

    /**
     * Unix timestamp in milliseconds
     *
     * Used for:
     * - freshness validation
     * - replay mitigation
     * - auditability
     */
    timestamp: z.number().int().positive(),

    /**
     * Current lifecycle status
     */
    status: RequestStatusSchema.default("CREATED"),

    /**
     * Optional expiration time
     *
     * Prevents:
     * - stale request execution
     * - delayed replay attacks
     */
    expiresAt: z.number().int().positive().optional(),

    /**
     * Cryptographic proof
     */
    signature: SignatureSchema,

    /**
     * Optional metadata
     *
     * Useful for:
     * - debugging
     * - tracing
     * - analytics
     */
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export type Request = z.infer<typeof RequestSchema>;

/**
 * ---------------------------------------------------------------------
 * Safe Request Parser
 * ---------------------------------------------------------------------
 *
 * NEVER trust:
 * - API input
 * - network packets
 * - deserialized JSON
 * - local cache
 *
 * Always validate.
 */

export function parseRequest(input: unknown): Request {
  return RequestSchema.parse(input);
}

/**
 * ---------------------------------------------------------------------
 * Safe Validation Helper
 * ---------------------------------------------------------------------
 *
 * Recommended for:
 * - transport packets
 * - API gateways
 * - P2P networking
 * - synchronization messages
 */

export function validateRequest(input: unknown) {
  return RequestSchema.safeParse(input);
}

/**
 * ---------------------------------------------------------------------
 * Freshness Validation Constants
 * ---------------------------------------------------------------------
 *
 * Maximum acceptable clock drift.
 *
 * Example:
 * 30 seconds
 */

export const MAX_CLOCK_DRIFT_MS = 30_000;

/**
 * ---------------------------------------------------------------------
 * Timestamp Freshness Helper
 * ---------------------------------------------------------------------
 *
 * Prevents:
 * - stale packets
 * - delayed replay attacks
 * - outdated settlement requests
 */

export function isRequestFresh(
  timestamp: number,
  now = Date.now()
): boolean {
  return (
    Math.abs(now - timestamp) <=
    MAX_CLOCK_DRIFT_MS
  );
}

/**
 * ---------------------------------------------------------------------
 * Expiration Validation Helper
 * ---------------------------------------------------------------------
 *
 * Rejects expired requests.
 */

export function isRequestExpired(
  expiresAt?: number,
  now = Date.now()
): boolean {
  if (!expiresAt) {
    return false;
  }

  return now > expiresAt;
}