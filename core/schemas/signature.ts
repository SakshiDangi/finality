import { z } from "zod";

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
 * Hex String Validation
 * ---------------------------------------------------------------------
 *
 * Most protocol cryptographic systems eventually use:
 *
 * - hex encoded public keys
 * - hex encoded signatures
 *
 * This regex ensures:
 *
 * - starts with 0x
 * - contains only hexadecimal characters
 */

const HexStringSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]+$/,
    "Invalid hexadecimal encoding"
  );

/**
 * ---------------------------------------------------------------------
 * Public Key Schema
 * ---------------------------------------------------------------------
 *
 * Represents signer identity.
 *
 * Example:
 *
 * - validator public key
 * - relayer public key
 * - wallet public key
 *
 * We keep:
 *
 * - algorithm aware
 * - encoding aware
 * - future extensible
 */

export const PublicKeySchema = z
  .object({
    /**
     * Cryptographic algorithm used
     */
    algorithm: SignatureAlgorithmSchema,

    /**
     * Hex encoded public key
     */
    key: HexStringSchema,

    /**
     * Optional metadata for future upgrades
     *
     * Example:
     * - compressed keys
     * - hardware signing
     * - validator identities
     */
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export type PublicKey = z.infer<typeof PublicKeySchema>;

/**
 * ---------------------------------------------------------------------
 * Signature Value Schema
 * ---------------------------------------------------------------------
 *
 * Represents the actual cryptographic proof.
 *
 * VERY IMPORTANT:
 *
 * A signature proves:
 *
 * "private key owner approved exact bytes"
 *
 * NOT:
 *
 * "request is automatically valid"
 */

export const SignatureValueSchema = z
  .object({
    /**
     * Hex encoded signature bytes
     */
    value: HexStringSchema,

    /**
     * Optional recovery identifier
     *
     * Useful for:
     * - secp256k1 recovery
     * - ethereum style signatures
     */
    recoveryId: z.number().int().nonnegative().optional(),
  })
  .strict();

export type SignatureValue = z.infer<
  typeof SignatureValueSchema
>;

/**
 * ---------------------------------------------------------------------
 * Main Signature Schema
 * ---------------------------------------------------------------------
 *
 * Represents a complete cryptographic proof object.
 *
 * This schema defines the:
 *
 * cryptographic trust boundary
 *
 * Everything inside MUST be verified before trust.
 */

export const SignatureSchema = z
  .object({
    /**
     * Schema version
     *
     * Enables:
     * - future upgrades
     * - migration handling
     * - backward compatibility
     */
    version: z.number().int().positive(),

    /**
     * Signature algorithm
     */
    algorithm: SignatureAlgorithmSchema,

    /**
     * Public identity of signer
     */
    publicKey: PublicKeySchema,

    /**
     * Actual cryptographic proof
     */
    signature: SignatureValueSchema,

    /**
     * Unix timestamp in milliseconds
     *
     * Used for:
     * - freshness guarantees
     * - stale proof rejection
     * - auditability
     */
    signedAt: z.number().int().positive(),

    /**
     * Optional domain separation tag (Important)
     *
     * Prevents cross-protocol replay.
     *
     * Example:
     *
     * "FINALITY_PROTOCOL_V1"
     */
    domain: z.string().min(1),

    /**
     * Optional metadata for future protocol upgrades
     */
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export type Signature = z.infer<typeof SignatureSchema>;

/**
 * ---------------------------------------------------------------------
 * Safe Parsing Helper
 * ---------------------------------------------------------------------
 *
 * NEVER trust external cryptographic input directly.
 *
 * Always validate before verification.
 */

export function parseSignature(input: unknown): Signature {
  return SignatureSchema.parse(input);
}

/**
 * ---------------------------------------------------------------------
 * Safe Validation Helper
 * ---------------------------------------------------------------------
 *
 * Recommended for:
 * - network packets
 * - transport layer
 * - API boundaries
 */

export function validateSignature(input: unknown) {
  return SignatureSchema.safeParse(input);
}