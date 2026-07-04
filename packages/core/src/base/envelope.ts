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

/* =========================================
 * UNSIGNED ENVELOPE
 * =======================================*/

/**
 * Unsigned protocol envelope.
 *
 * Exists BEFORE cryptographic signing.
 */
export const UnsignedEnvelopeSchema =
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
     * Optional runtime metadata.
     *
     * NEVER signed.
     * NEVER trusted for consensus.
     */
    metadata:
      EnvelopeMetadataSchema
        .optional(),
  });

/* =========================================
 * SIGNED ENVELOPE
 * =======================================*/

/**
 * Canonical signed protocol envelope.
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
  UnsignedEnvelopeSchema.extend({
    /**
     * Canonical cryptographic signature.
     */
    signature:
      HexStringSchema,
  });

/* =========================================
 * TYPES
 * =======================================*/

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
 * Signed envelope type.
 */
export type Envelope =
  z.infer<
    typeof EnvelopeSchema
  >;

export interface UnsignedEnvelope {
  header:
    Envelope["header"];

  payload:
    Envelope["payload"];
}