import { z } from "zod";

/**
 * Distributed trace identifier.
 *
 * Used for protocol observability
 * across relayers and validators.
 */
export const TraceIdSchema =
  z.string()
    .min(1)
    .max(128);

/**
 * Relay node identifier.
 */
export const RelayIdSchema =
  z.string()
    .min(1)
    .max(128);

/**
 * Compression algorithm metadata.
 */
export const CompressionSchema =
  z.enum([
    "NONE",
    "GZIP",
    "BROTLI",
  ]);

/**
 * Protocol transport metadata.
 *
 * This metadata is NEVER part of:
 *
 * - signature verification
 * - consensus state
 * - settlement state
 * - replay protection
 */
export const MetadataSchema =
  z.object({
    /**
     * Distributed request trace id.
     */
    traceId:
      TraceIdSchema.optional(),

    /**
     * Relay node identifier.
     */
    relayId:
      RelayIdSchema.optional(),

    /**
     * Packet hop count.
     */
    hopCount:
      z.number()
        .int()
        .nonnegative()
        .optional(),

    /**
     * Local receive timestamp.
     */
    receivedAt:
      z.number()
        .int()
        .nonnegative()
        .optional(),

    /**
     * Payload compression metadata.
     */
    compression:
      CompressionSchema
        .optional(),

    /**
     * Transport region.
     */
    region:
      z.string()
        .min(1)
        .max(64)
        .optional(),
  });

export type Compression =
  z.infer<
    typeof CompressionSchema
  >;

export type Metadata =
  z.infer<
    typeof MetadataSchema
  >;