import { z } from "zod";

import {
  HeaderSchema,
} from "./header.js";

import {
  HexStringSchema,
} from "./primitives.js";

/**
 * Arbitrary protocol payload.
 *
 * Wrapper applications define
 * domain-specific payloads on top
 * of this base transport layer.
 */
export const EnvelopePayloadSchema =
  z.record(
    z.string(),
    z.unknown(),
  );

/**
 * Runtime-only metadata.
 *
 * Metadata is intentionally excluded
 * from cryptographic signing boundaries.
 *
 * Safe examples:
 * - tracing
 * - routing hints
 * - diagnostics
 * - transport context
 */
export const EnvelopeMetadataSchema =
  z.record(
    z.string(),
    z.unknown(),
  );

/**
 * Canonical protocol envelope.
 *
 * This is the primary transport object
 * exchanged across:
 *
 * - validators
 * - relayers
 * - settlement engines
 * - wrappers
 * - synchronization layers
 */
export const EnvelopeSchema =
  z.strictObject({
    /**
     * Protocol control plane data.
     */
    header:
      HeaderSchema,

    /**
     * Application/business payload.
     *
     * Signed together with header.
     */
    payload:
      EnvelopePayloadSchema,

    /**
     * Canonical cryptographic signature.
     *
     * Usually signs:
     *
     * canonicalize(
     *   header + payload
     * )
     */
    signature:
      HexStringSchema,

    /**
     * Optional runtime metadata.
     *
     * NEVER signed.
     * NEVER trusted for consensus.
     */
    metadata:
      EnvelopeMetadataSchema
        .optional(),
  });

/**
 * Runtime envelope payload type.
 */
export type EnvelopePayload =
  z.infer<
    typeof EnvelopePayloadSchema
  >;

/**
 * Runtime envelope metadata type.
 */
export type EnvelopeMetadata =
  z.infer<
    typeof EnvelopeMetadataSchema
  >;

/**
 * Canonical protocol envelope type.
 */
export type Envelope =
  z.infer<
    typeof EnvelopeSchema
  >;