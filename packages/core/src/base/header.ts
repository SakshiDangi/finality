import { z } from "zod";

import {
  MessageKindSchema,
  PacketPrioritySchema,
  SignatureAlgorithmSchema,
} from "./enums.js";

/* =========================================
 * HEADER SCHEMA
 * =======================================*/

export const HeaderSchema =
  z.object({
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
     * Ethereum-style address for now
     */
    sender:
      z.string()
        .regex(
          /^0x[a-fA-F0-9]{40}$/,
          "Invalid sender address",
        ),

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

export type Header =
  z.infer<typeof HeaderSchema>;