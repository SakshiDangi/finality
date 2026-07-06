import {
  canonicalJSONStringify,
} from "../crypto/canonical.js";

/**
 * Deterministically canonicalize payload.
 */
export function canonicalizePayload(
  payload: Record<string, unknown>,
): string {

  return canonicalJSONStringify(
    payload,
  );
}