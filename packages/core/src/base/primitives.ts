import { z } from "zod";

/**
 * Universal protocol identifier.
 *
 * Examples:
 * validator-1
 * packet-abc
 * bridge-node-7
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

/**
 * Canonical hex string.
 *
 * All cryptographic primitives
 * inside the protocol should
 * use strict hex typing.
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

/**
 * Protocol address.
 *
 * Currently Ethereum-style.
 */
export type Address =
  `0x${string}`;

/**
 * Runtime protocol address validator.
 */
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


/**
 * Runtime primitive types.
 */
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