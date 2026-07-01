import { z } from "zod";

import { SignatureSchema } from "./signature";

import {
  IdentifierSchema,
  MAX_PACKET_AGE_MS,
  MAX_PAYLOAD_SIZE_BYTES,
  MetadataSchema,
  PacketTypeSchema,
  TimestampSchema,
} from "./common";

/**
 * ---------------------------------------------------------------------
 * Packet Priority Schema
 * ---------------------------------------------------------------------
 *
 * Useful for:
 * - validator coordination
 * - settlement urgency
 * - synchronization ordering
 */

export const PacketPrioritySchema = z.enum([
  "LOW",
  "NORMAL",
  "HIGH",
  "CRITICAL",
]);

export type PacketPriority = z.infer<
  typeof PacketPrioritySchema
>;

/**
 * ---------------------------------------------------------------------
 * Packet Status Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * transport lifecycle state.
 */

export const PacketStatusSchema = z.enum([
  "PENDING",
  "RECEIVED",
  "PROCESSED",
  "REJECTED",
  "EXPIRED",
]);

export type PacketStatus = z.infer<
  typeof PacketStatusSchema
>;

/**
 * ---------------------------------------------------------------------
 * Transport Payload Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 * generic network payload container.
 *
 * Payload remains UNTRUSTED
 * until validated by downstream schemas.
 */

export const TransportPayloadSchema = z
  .object({
    /**
     * Raw protocol payload
     */
    data: z.unknown(),

    /**
     * Payload encoding type
     *
     * Useful later for:
     * - binary encoding
     * - protobuf
     * - msgpack
     */
    encoding: z.enum([
      "JSON",
      "HEX",
      "BINARY",
    ]),

    /**
     * Approximate payload size
     *
     * Protects against:
     * - oversized packets
     * - memory exhaustion
     */
    size: z
      .number()
      .int()
      .nonnegative()
      .max(MAX_PAYLOAD_SIZE_BYTES),
  })
  .strict();

export type TransportPayload = z.infer<
  typeof TransportPayloadSchema
>;

/**
 * ---------------------------------------------------------------------
 * Transport Packet Schema
 * ---------------------------------------------------------------------
 *
 * Represents:
 *
 * untrusted network message
 *
 * This schema defines:
 *
 * network trust boundary
 */

export const TransportPacketSchema = z
  .object({
    /**
     * Schema version
     */
    version: z.number().int().positive(),

    /**
     * Unique packet identifier
     */
    packetId: IdentifierSchema,

    /**
     * Packet category
     */
    packetType: PacketTypeSchema,

    /**
     * Network sender identity
     */
    sender: IdentifierSchema,

    /**
     * Intended recipient
     *
     * Optional for:
     * - broadcasts
     * - gossip protocols
     */
    recipient:
      IdentifierSchema.optional(),

    /**
     * Transport payload
     */
    payload: TransportPayloadSchema,

    /**
     * Packet priority
     */
    priority:
      PacketPrioritySchema.default(
        "NORMAL"
      ),

    /**
     * Packet lifecycle state
     */
    status:
      PacketStatusSchema.default(
        "PENDING"
      ),

    /**
     * Sequence number
     *
     * Useful for:
     * - ordered delivery
     * - synchronization
     * - replay protection
     */
    sequence: z
      .number()
      .int()
      .nonnegative(),

    /**
     * Packet timestamp
     */
    timestamp: TimestampSchema,

    /**
     * Time-to-live in milliseconds
     *
     * Prevents:
     * - stale packets
     * - delayed replay
     */
    ttl: z
      .number()
      .int()
      .positive(),

    /**
     * Packet hop count
     *
     * Useful for:
     * - gossip protocols
     * - routing analysis
     */
    hops: z
      .number()
      .int()
      .nonnegative()
      .default(0),

    /**
     * Packet signature
     *
     * Optional because:
     * some transport layers
     * may not require signatures.
     */
    signature:
      SignatureSchema.optional(),

    /**
     * Whether packet has been processed
     */
    processed: z.boolean(),

    /**
     * Optional correlation ID
     *
     * Useful for:
     * - request/response tracing
     * - synchronization workflows
     */
    correlationId:
      IdentifierSchema.optional(),

    /**
     * Optional metadata
     */
    metadata: MetadataSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    /**
     * -------------------------------------------------------------
     * Expiration Validation
     * -------------------------------------------------------------
     */

    const expiresAt =
      data.timestamp + data.ttl;

    if (Date.now() > expiresAt) {
      ctx.addIssue({
        code: "custom",
        message: "Packet expired",
        path: ["ttl"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Packet Age Validation
     * -------------------------------------------------------------
     */

    const packetAge =
      Date.now() - data.timestamp;

    if (
      packetAge > MAX_PACKET_AGE_MS
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Packet exceeds maximum allowed age",
        path: ["timestamp"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Processed Status Validation
     * -------------------------------------------------------------
     */

    if (
      data.processed &&
      data.status === "PENDING"
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Processed packets cannot remain PENDING",
        path: ["status"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Payload Size Validation
     * -------------------------------------------------------------
     */

    if (
      data.payload.size >
      MAX_PAYLOAD_SIZE_BYTES
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Payload exceeds maximum allowed size",
        path: ["payload", "size"],
      });
    }

    /**
     * -------------------------------------------------------------
     * Sequence Validation
     * -------------------------------------------------------------
     */

    if (data.sequence < 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "Invalid packet sequence number",
        path: ["sequence"],
      });
    }
  });

export type TransportPacket = z.infer<
  typeof TransportPacketSchema
>;

/**
 * ---------------------------------------------------------------------
 * Safe Packet Parser
 * ---------------------------------------------------------------------
 */

export function parseTransportPacket(
  input: unknown
): TransportPacket {
  return TransportPacketSchema.parse(
    input
  );
}

/**
 * ---------------------------------------------------------------------
 * Safe Packet Validator
 * ---------------------------------------------------------------------
 */

export function validateTransportPacket(
  input: unknown
) {
  return TransportPacketSchema.safeParse(
    input
  );
}

/**
 * ---------------------------------------------------------------------
 * Packet Expiration Helper
 * ---------------------------------------------------------------------
 */

export function isPacketExpired(
  packet: TransportPacket,
  now = Date.now()
): boolean {
  return (
    now >
    packet.timestamp + packet.ttl
  );
}

/**
 * ---------------------------------------------------------------------
 * Packet Freshness Helper
 * ---------------------------------------------------------------------
 */

export function isFreshPacket(
  packet: TransportPacket,
  now = Date.now()
): boolean {
  return (
    now - packet.timestamp <=
    MAX_PACKET_AGE_MS
  );
}

/**
 * ---------------------------------------------------------------------
 * Packet Routing Helper
 * ---------------------------------------------------------------------
 */

export function isBroadcastPacket(
  packet: TransportPacket
): boolean {
  return !packet.recipient;
}

/**
 * ---------------------------------------------------------------------
 * Packet Processing Helper
 * ---------------------------------------------------------------------
 */

export function canProcessPacket(
  packet: TransportPacket
): boolean {
  return (
    !packet.processed &&
    !isPacketExpired(packet)
  );
}