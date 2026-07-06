import {
  Envelope,
} from "../base/envelope.js";

/**
 * Canonical protocol value.
 *
 * Only deterministic JSON-safe
 * values are allowed.
 */
export type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | {
      [key: string]:
        CanonicalValue;
    };

/**
 * Recursively sorts object keys
 * to guarantee deterministic
 * serialization.
 *
 * Critical for:
 * - hashing
 * - signatures
 * - replay protection
 * - validator agreement
 * - synchronization
 */
export function sortCanonicalKeys(
  value: unknown,
): CanonicalValue {
  /**
   * Primitive values remain unchanged.
   */
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value;
  }

  /**
   * Arrays preserve order.
   *
   * Array order is semantically important.
   */
  if (Array.isArray(value)) {
    return value.map(
      sortCanonicalKeys,
    );
  }

  /**
   * Objects must be recursively
   * sorted lexicographically.
   */
  if (
    typeof value === "object"
  ) {
    const sortedEntries =
      Object.entries(
        value as Record<
          string,
          unknown
        >,
      )
        .sort(
          ([left], [right]) =>
            left.localeCompare(
              right,
            ),
        )
        .map(
          ([key, nestedValue]) => [
            key,
            sortCanonicalKeys(
              nestedValue,
            ),
          ],
        );

    return Object.fromEntries(
      sortedEntries,
    );
  }

  /**
   * Unsupported runtime values.
   */
  throw new Error(
    "Unsupported canonical value",
  );
}

/**
 * Converts arbitrary protocol data
 * into deterministic JSON.
 *
 * Same logical input ALWAYS
 * produces same serialized output.
 */
export function canonicalJSONStringify(
  value: unknown,
): string {
  return JSON.stringify(
    sortCanonicalKeys(value),
  );
}

/**
 * Produces canonical signing payload
 * for protocol envelopes.
 *
 * IMPORTANT:
 * - excludes signature
 * - excludes metadata
 *
 * Only header + payload
 * participate in signing.
 */
export function canonicalizeEnvelope(
  envelope: Pick<Envelope, "header" | "payload">,
): string {
  return canonicalJSONStringify({
    header:
      envelope.header,

    payload:
      envelope.payload,
  });
}

/**
 * Generic canonical serializer.
 *
 * Alias used by crypto modules.
 */
export const canonicalSerialize =
  canonicalJSONStringify;