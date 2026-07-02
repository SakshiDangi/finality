/**
 * ---------------------------------------------------------------------
 * Hash Algorithms
 * ---------------------------------------------------------------------
 */

export type HashAlgorithm =
  | "keccak256"
  | "sha256";

/**
 * ---------------------------------------------------------------------
 * Serializable Primitive Types
 * ---------------------------------------------------------------------
 */

export type Serializable =
  | null
  | boolean
  | number
  | string
  | bigint
  | Serializable[]
  | {
      [key: string]: Serializable;
    };

/**
 * ---------------------------------------------------------------------
 * Protocol Wallet
 * ---------------------------------------------------------------------
 */

export interface ProtocolWallet {
  address: string;

  publicKey: string;

  privateKey: string;
}

/**
 * ---------------------------------------------------------------------
 * Signed Payload
 * ---------------------------------------------------------------------
 */

export interface SignedPayload {
  signer: string;

  algorithm: HashAlgorithm;

  digest: string;

  signature: string;

  serialized: string;

  signedAt: number;
}

/**
 * ---------------------------------------------------------------------
 * Verification Reasons
 * ---------------------------------------------------------------------
 */

export type VerificationReason =
  | "VALID"
  | "INVALID_SIGNATURE"
  | "INVALID_SIGNER"
  | "INVALID_DIGEST"
  | "INVALID_PAYLOAD"
  | "SIGNATURE_RECOVERY_FAILED";

/**
 * ---------------------------------------------------------------------
 * Verification Result
 * ---------------------------------------------------------------------
 */

export interface VerificationResult {
  verified: boolean;

  reason: VerificationReason;

  recoveredSigner:
    | string
    | null;

  expectedSigner:
    | string
    | null;

  digest: string | null;
}