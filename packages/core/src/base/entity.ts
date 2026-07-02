import { z } from "zod";

import {
  IdentifierSchema,
  MetadataSchema,
  TimestampSchema
} from "./primitives.js";

/**
 * Universal protocol entity.
 *
 * Every protocol object should extend this schema.
 */
export const BaseEntitySchema = z.object({
  /**
   * Unique entity identifier.
   */
  id: IdentifierSchema,

  /**
   * Entity version.
   *
   * Important for:
   * migrations
   * compatibility
   * synchronization
   */
  version: z.string().min(1),

  /**
   * Creation timestamp.
   */
  createdAt: TimestampSchema,

  /**
   * Last update timestamp.
   */
  updatedAt: TimestampSchema,

  /**
   * Arbitrary metadata.
   */
  metadata: MetadataSchema.default({})
});