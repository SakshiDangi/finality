/* =========================================
 * ENVELOPE
 * =======================================*/

export {
  createEnvelope,
} from "./base/envelope.js";

/* =========================================
 * PAYLOAD
 * =======================================*/

export {
  canonicalizePayload,
  hashPayload,
} from "./payload/index.js";

/* =========================================
 * SIGNATURES
 * =======================================*/

export {
  signDigest,
  verifyDigestSignature,
} from "./crypto/signatures.js";

/* =========================================
 * TYPES
 * =======================================*/

export type {
  Envelope,
} from "./base/envelope.js";

export type {
  HashDigest,
  SignatureHex,
  PublicKey,
  PrivateKey,
} from "./base/primitives.js";

