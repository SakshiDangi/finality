import {
  toUtf8Bytes,
  hexlify,
} from "ethers";

import type {
  Serializable,
} from "./types";

import {
  SerializationError,
} from "./errors";

/**
 * ---------------------------------------------------------------------
 * Normalize Serializable Value
 * ---------------------------------------------------------------------
 *
 * Guarantees:
 * deterministic serialization.
 *
 * Rules:
 * - object keys sorted
 * - undefined removed
 * - bigint normalized
 * - buffers hex encoded
 */

export function normalizeValue(
  value: unknown
): Serializable {
  /**
   * -------------------------------------------------------------
   * Null
   * -------------------------------------------------------------
   */

  if (value === null) {
    return null;
  }

  /**
   * -------------------------------------------------------------
   * Primitive Types
   * -------------------------------------------------------------
   */

  if (
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  /**
   * -------------------------------------------------------------
   * Numbers
   * -------------------------------------------------------------
   */

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new SerializationError(
        "Non-finite numbers are not serializable"
      );
    }

    return value;
  }

  /**
   * -------------------------------------------------------------
   * BigInt
   * -------------------------------------------------------------
   *
   * MUST normalize deterministically.
   */

  if (typeof value === "bigint") {
    return value.toString();
  }

  /**
   * -------------------------------------------------------------
   * Uint8Array / Buffer
   * -------------------------------------------------------------
   */

  if (
    value instanceof Uint8Array
  ) {
    return hexlify(value);
  }

  /**
   * -------------------------------------------------------------
   * Arrays
   * -------------------------------------------------------------
   *
   * IMPORTANT:
   * preserve ordering.
   */

  if (Array.isArray(value)) {
    return value.map((item) =>
      normalizeValue(item)
    );
  }

  /**
   * -------------------------------------------------------------
   * Objects
   * -------------------------------------------------------------
   */

  if (
    typeof value === "object"
  ) {
    const normalizedObject:
      Record<
        string,
        Serializable
      > = {};

    /**
     * IMPORTANT:
     * deterministic key ordering
     */

    const keys = Object.keys(
      value as Record<
        string,
        unknown
      >
    ).sort();

    for (const key of keys) {
      const field = (
        value as Record<
          string,
          unknown
        >
      )[key];

      /**
       * Remove undefined values
       */

      if (field === undefined) {
        continue;
      }

      normalizedObject[key] =
        normalizeValue(field);
    }

    return normalizedObject;
  }

  /**
   * -------------------------------------------------------------
   * Unsupported Types
   * -------------------------------------------------------------
   */

  throw new SerializationError(
    `Unsupported value type: ${typeof value}`
  );
}

/**
 * ---------------------------------------------------------------------
 * Canonical JSON Serialization
 * ---------------------------------------------------------------------
 *
 * Produces:
 * deterministic JSON string.
 */

export function serializeCanonical(
  value: unknown
): string {
  const normalized =
    normalizeValue(value);

  return JSON.stringify(
    normalized
  );
}

/**
 * ---------------------------------------------------------------------
 * Canonical UTF-8 Bytes
 * ---------------------------------------------------------------------
 *
 * Produces:
 * deterministic protocol bytes.
 */

export function serializeToBytes(
  value: unknown
): Uint8Array {
  const canonical =
    serializeCanonical(value);

  return toUtf8Bytes(canonical);
}

/**
 * ---------------------------------------------------------------------
 * Canonical Hex Encoding
 * ---------------------------------------------------------------------
 *
 * Useful for:
 * - hashing
 * - signatures
 * - transport payloads
 */

export function serializeToHex(
  value: unknown
): string {
  return hexlify(
    serializeToBytes(value)
  );
}

/**
 * ---------------------------------------------------------------------
 * Deep Equality Helper
 * ---------------------------------------------------------------------
 *
 * Useful for:
 * deterministic verification.
 */

export function areCanonicallyEqual(
  a: unknown,
  b: unknown
): boolean {
  return (
    serializeCanonical(a) ===
    serializeCanonical(b)
  );
}