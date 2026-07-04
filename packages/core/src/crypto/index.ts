/**
 * Finality Protocol
 * Cryptography Layer
 *
 * Central export surface for:
 * - canonical serialization
 * - hashing
 * - signatures
 * - identities
 * - signing domains
 */

/* ---------------------------------- */
/* Canonical Serialization            */
/* ---------------------------------- */

export {
  canonicalJSONStringify,
  canonicalizeEnvelope,
  sortCanonicalKeys,
} from "./canonical.js";

export type {
  CanonicalValue,
} from "./canonical.js";

/* ---------------------------------- */
/* Hashing                            */
/* ---------------------------------- */

export {
  HASH_ALGORITHM,
  hashCanonical,
  hashesEqual,
  hashString,
} from "./hashing.js";

export type {
  HashAlgorithm,
  HashDigest,
} from "./hashing.js";

/* ---------------------------------- */
/* Signatures                         */
/* ---------------------------------- */

export {
  derivePublicKey,
  signEnvelope,
  verifyDigestSignature,
} from "./signatures.js";

export type {
  PrivateKey,
  PublicKey,
  Signature,
} from "./signatures.js";

/* ---------------------------------- */
/* Identity                           */
/* ---------------------------------- */

export {
  createIdentity,
  deriveAddress,
  generateKeyPair,
  generatePrivateKey,
  isValidAddress,
  isValidPrivateKey,
  isValidPublicKey,
} from "./identity.js";

export type {
  KeyPair,
  ProtocolAddress,
  ProtocolIdentity,
} from "./identity.js";

/* ---------------------------------- */
/* Signing Domains                    */
/* ---------------------------------- */

export {
  DEFAULT_SIGNING_DOMAIN,
  ENVIRONMENT_DOMAIN,
  PROTOCOL_DOMAIN,
  WRAPPER_DOMAIN,
  createSigningDomain,
  createWrapperDomain,
  isValidSigningDomain,
} from "./domain.js";

export type {
  EnvironmentDomain,
  ProtocolDomain,
  SigningDomain,
  WrapperDomain,
} from "./domain.js";