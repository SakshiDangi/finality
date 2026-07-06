import { z } from "zod";

import {
  MessageKindSchema,
  PacketPrioritySchema,
  SignatureAlgorithmSchema,
} from "./enums.js";

import {
  AddressSchema,
  HexStringSchema,
} from "./primitives.js";

import type {
  ProtocolAddress,
  PublicKey,
} from "./primitives.js";

/* =========================================
 * HEADER SCHEMA
 * =======================================*/

export const HeaderSchema =
  z.strictObject({
    /*
     * Unique message identifier
     */
    messageId:
      z.string()
        .min(1),

    /*
     * Protocol domain separator
     */
    domain:
      z.string()
        .min(1),

    /*
     * REQUEST | RESPONSE
     */
    messageKind:
      MessageKindSchema,

    /*
     * Sender identity
     * Ethereum-style address
     */
    sender:
      AddressSchema,

    /*
     * Sender verification key
     */
    publicKey:
      HexStringSchema,

    /*
     * UNIX timestamp in milliseconds
     */
    timestamp:
      z.number()
        .int()
        .nonnegative(),

    /*
     * Replay protection nonce
     */
    nonce:
      z.number()
        .int()
        .nonnegative(),

    /*
     * Packet ordering sequence
     */
    sequence:
      z.number()
        .int()
        .nonnegative(),

    /*
     * Time-to-live in milliseconds
     */
    ttl:
      z.number()
        .positive()
        .default(30_000),

    /*
     * Cryptographic signature algorithm
     */
    signatureAlgorithm:
      SignatureAlgorithmSchema
        .default("SECP256K1"),

    /*
     * Transport/network priority
     */
    priority:
      PacketPrioritySchema
        .default("NORMAL"),

    /*
     * Protocol identifier
     */
    protocol:
      z.string()
        .default("FINALITY"),

    /*
     * Protocol semantic version
     */
    version:
      z.string()
        .default("1.0.0"),
  });

/* =========================================
 * TYPES
 * =======================================*/

export interface Header
  extends z.infer<
    typeof HeaderSchema
  > {
  sender:
    ProtocolAddress;

  publicKey:
    PublicKey;
}