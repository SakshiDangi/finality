import { z } from "zod";

/**
 * Universal protocol identifier.
 *
 * Examples:
 * validator-1
 * packet-abc
 * bridge-node-7
 */
export const IdentifierSchema = z
  .string()
  .min(1)
  .max(128);

/**
 * Unix timestamp in milliseconds.
 */
export const TimestampSchema = z
  .number()
  .int()
  .nonnegative();

/**
 * Monotonic nonce value.
 */
export const NonceSchema = z
  .number()
  .int()
  .nonnegative();

/**
 * Hexadecimal string with 0x prefix.
 */
export const HexStringSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/);

/**
 * Generic protocol address.
 */
export const AddressSchema =
  HexStringSchema;

/**
 * Arbitrary metadata object.
 */
export const MetadataSchema = z.record(
  z.string(),
  z.unknown()
);

export type Identifier = z.infer<
  typeof IdentifierSchema
>;

export type Timestamp = z.infer<
  typeof TimestampSchema
>;

export type Nonce = z.infer<
  typeof NonceSchema
>;

export type HexString = z.infer<
  typeof HexStringSchema
>;

export type Address = z.infer<
  typeof AddressSchema
>;