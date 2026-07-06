import {
  hashCanonical,
} from "../crypto/hashing.js";

import {
  canonicalizePayload,
} from "./canonicalize.js";

/**
 * Hash canonical payload.
 */
export function hashPayload(
  payload: Record<string, unknown>,
): `0x${string}` {

  return hashCanonical(
    canonicalizePayload(
      payload,
    ),
  );
}