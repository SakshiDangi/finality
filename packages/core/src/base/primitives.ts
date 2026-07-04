import { z } from "zod";

/* =========================================
 * CORE RUNTIME SCHEMAS
 * =======================================*/

/**
 * Universal protocol identifier.
 */
export const IdentifierSchema =
  z.string()
    .min(1)
    .max(128);

/**
 * Unix timestamp in milliseconds.
 */
export const TimestampSchema =
  z.number()
    .int()
    .nonnegative();

/**
 * Monotonic replay-protection nonce.
 */
export const NonceSchema =
  z.number()
    .int()
    .nonnegative();

/* =========================================
 * HEX TYPES
 * =======================================*/

/**
 * Canonical hex string.
 */
export type HexString =
  `0x${string}`;

/**
 * Runtime hex validator.
 */
export const HexStringSchema =
  z.custom<HexString>(
    (value) => {
      return (
        typeof value ===
          "string" &&
        /^0x[a-fA-F0-9]+$/.test(
          value,
        )
      );
    },
    {
      message:
        "Invalid hex string",
    },
  );

/* =========================================
 * CRYPTOGRAPHIC TYPES
 * =======================================*/

export type HashDigest =
  `0x${string}`;

export type SignatureHex =
  `0x${string}`;

export type PrivateKey =
  `0x${string}`;

export type PublicKey =
  `0x${string}`;

export type Address =
  `0x${string}`;

export type ProtocolAddress =
  `0x${string}`;

/* =========================================
 * ADDRESS SCHEMA
 * =======================================*/

export const AddressSchema =
  z.custom<Address>(
    (value) => {
      return (
        typeof value ===
          "string" &&
        /^0x[a-fA-F0-9]{40}$/.test(
          value,
        )
      );
    },
    {
      message:
        "Invalid address",
    },
  );

/* =========================================
 * INFERRED TYPES
 * =======================================*/

export type Identifier =
  z.infer<
    typeof IdentifierSchema
  >;

export type Timestamp =
  z.infer<
    typeof TimestampSchema
  >;

export type Nonce =
  z.infer<
    typeof NonceSchema
  >;