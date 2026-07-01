import { z } from "zod";

/**
 * ---------------------------------------------------------------------
 * Protocol Constants
 * ---------------------------------------------------------------------
 */

export const PROTOCOL_NAME = "FINALITY_PROTOCOL";

export const PROTOCOL_VERSION = 1;

/**
 * ---------------------------------------------------------------------
 * Security Constants
 * ---------------------------------------------------------------------
 */
/**
 * Maximum acceptable clock drift.
 *
 * Used for:
 * - freshness validation
 * - replay mitigation
 * - stale request rejection
 */
export const MAX_CLOCK_DRIFT_MS = 30_000;

/**
 * Maximum packet age.
 *
 * Example:
 * reject packets older than 5 minutes.
 */
export const MAX_PACKET_AGE_MS = 5 * 60 * 1000;

/**
 * Maximum payload size.
 *
 * Prevents:
 * - oversized packet attacks
 * - memory abuse
 * - transport flooding
 */
export const MAX_PAYLOAD_SIZE_BYTES = 1024 * 64;

/**
 * ---------------------------------------------------------------------
 * Shared Regex Validators
 * ---------------------------------------------------------------------
 */

/**
 * Hexadecimal validator.
 *
 * Enforces:
 * - 0x prefix
 * - valid hexadecimal characters
 */
export const HEX_REGEX =
  /^0x[a-fA-F0-9]+$/;

/**
 * UUID validator.
 *
 * Useful for:
 * - packet IDs
 * - request IDs
 * - attestation IDs
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ---------------------------------------------------------------------
 * Shared Primitive Schemas
 * ---------------------------------------------------------------------
 */

/**
 * Hex string schema
 */
export const HexStringSchema = z
  .string()
  .regex(
    HEX_REGEX,
    "Invalid hexadecimal encoding"
  );

/**
 * Timestamp schema
 *
 * Unix timestamp in milliseconds.
 */
export const TimestampSchema = z
  .number()
  .int()
  .positive();

/**
 * Nonce schema
 *
 * Replay protection primitive.
 */
export const NonceSchema = z
  .number()
  .int()
  .nonnegative();

/**
 * Generic identifier schema
 */
export const IdentifierSchema = z
  .string()
  .min(1)
  .max(256);

/**
 * Public address schema
 *
 * Later replace with:
 * - Ethereum address validation
 * - validator identities
 * - DID support
 */
export const AddressSchema = z
  .string()
  .min(1)
  .max(256);

/**
 * ---------------------------------------------------------------------
 * Protocol Request Actions
 * ---------------------------------------------------------------------
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
 * Request Lifecycle States
 * ---------------------------------------------------------------------
 */

export const RequestStateSchema = z.enum([
  "CREATED",
  "VERIFIED",
  "FINALIZED",
  "REJECTED",
]);

export type RequestState = z.infer<
  typeof RequestStateSchema
>;

/**
 * ---------------------------------------------------------------------
 * Verification Failure Reasons
 * ---------------------------------------------------------------------
 *
 * VERY important for:
 * - auditing
 * - debugging
 * - deterministic rejection logic
 */

export const VerificationReasonSchema = z.enum([
  "INVALID_SIGNATURE",
  "INVALID_NONCE",
  "REPLAY_DETECTED",
  "STALE_TIMESTAMP",
  "EXPIRED_REQUEST",
  "INVALID_PAYLOAD",
  "INVALID_STATE_TRANSITION",
  "UNAUTHORIZED_SENDER",
  "MALFORMED_PACKET",
]);

export type VerificationReason = z.infer<
  typeof VerificationReasonSchema
>;

/**
 * ---------------------------------------------------------------------
 * Transport Packet Types
 * ---------------------------------------------------------------------
 */

export const PacketTypeSchema = z.enum([
  "REQUEST",
  "ATTESTATION",
  "SYNC",
  "SETTLEMENT",
  "VERIFICATION",
]);

export type PacketType = z.infer<
  typeof PacketTypeSchema
>;

/**
 * ---------------------------------------------------------------------
 * Signature Algorithms
 * ---------------------------------------------------------------------
 */

export const SignatureAlgorithmSchema = z.enum([
  "ED25519",
  "SECP256K1",
  "BLS",
]);

export type SignatureAlgorithm = z.infer<
  typeof SignatureAlgorithmSchema
>;

/**
 * ---------------------------------------------------------------------
 * Verification Status
 * ---------------------------------------------------------------------
 */

export const VerificationStatusSchema = z.enum([
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

export type VerificationStatus = z.infer<
  typeof VerificationStatusSchema
>;

/**
 * ---------------------------------------------------------------------
 * Synchronization States
 * ---------------------------------------------------------------------
 */

export const SynchronizationStateSchema = z.enum([
  "SYNCING",
  "IN_SYNC",
  "OUT_OF_SYNC",
]);

export type SynchronizationState = z.infer<
  typeof SynchronizationStateSchema
>;

/**
 * ---------------------------------------------------------------------
 * Shared Metadata Schema
 * ---------------------------------------------------------------------
 *
 * Flexible extension point.
 */

export const MetadataSchema = z.record(
  z.string(),
  z.unknown()
);

/**
 * ---------------------------------------------------------------------
 * Freshness Validation Helper
 * ---------------------------------------------------------------------
 */

export function isFreshTimestamp(
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
 */

export function isExpired(
  expiresAt?: number,
  now = Date.now()
): boolean {
  if (!expiresAt) {
    return false;
  }

  return now > expiresAt;
}