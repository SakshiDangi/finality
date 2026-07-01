import {
  Wallet,
  Signature,
} from "ethers";

import {
  hashKeccak256,
} from "./hash";

import {
  serializeCanonical,
} from "./serialization";

import {
  isValidPrivateKey,
} from "./wallet";

/**
 * ---------------------------------------------------------------------
 * Signature Error
 * ---------------------------------------------------------------------
 */

export class SigningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SigningError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Signed Payload Structure
 * ---------------------------------------------------------------------
 */

export interface SignedPayload {
  signer: string;
  algorithm: "keccak256";
  digest: string;
  signature: string;
  serialized: string;
  signedAt: number;
}

/**
 * ---------------------------------------------------------------------
 * Signature Validation
 * ---------------------------------------------------------------------
 */

export function isValidSignature(
  signature: string
): boolean {
  return /^0x[a-fA-F0-9]{130}$/i.test(
    signature
  );
}

/**
 * ---------------------------------------------------------------------
 * Sign Digest
 * ---------------------------------------------------------------------
 * Signs:
 * deterministic digest.
 */

export async function signDigest(
  digest: string,
  privateKey: string
): Promise<string> {
  try {
    if (
      !isValidPrivateKey(
        privateKey
      )
    ) {
      throw new SigningError(
        "Invalid private key"
      );
    }

    const wallet =
      new Wallet(privateKey);

    /**
     * IMPORTANT:
     * sign raw digest bytes
     */

    const signature =
      await wallet.signMessage(
        Buffer.from(
          digest.slice(2),
          "hex"
        )
      );

    if (
      !isValidSignature(
        signature
      )
    ) {
      throw new SigningError(
        "Generated invalid signature"
      );
    }

    return signature;
  } catch (error) {
    throw new SigningError(
      `Digest signing failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Sign Payload
 * ---------------------------------------------------------------------
 * Full deterministic signing flow.
 */

export async function signPayload(
  payload: unknown,
  privateKey: string
): Promise<SignedPayload> {
  try {
    if (
      !isValidPrivateKey(
        privateKey
      )
    ) {
      throw new SigningError(
        "Invalid private key"
      );
    }

    const wallet =
      new Wallet(privateKey);

    /**
     * -------------------------------------------------------------
     * Canonical Serialization
     * -------------------------------------------------------------
     */

    const serialized =
      serializeCanonical(
        payload
      );

    /**
     * -------------------------------------------------------------
     * Deterministic Hash
     * -------------------------------------------------------------
     */

    const digest =
      hashKeccak256(payload);

    /**
     * -------------------------------------------------------------
     * Sign Digest
     * -------------------------------------------------------------
     */

    const signature =
      await signDigest(
        digest,
        privateKey
      );

    return {
      signer:
        wallet.address,
      algorithm:
        "keccak256",
      digest,
      signature,
      serialized,
      signedAt: Date.now(),
    };
  } catch (error) {
    throw new SigningError(
      `Payload signing failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Split Signature
 * ---------------------------------------------------------------------
 *
 * Useful for:
 * - transport
 * - smart contracts
 * - audits
 */

export function splitSignature(
  signature: string
) {
  try {
    if (
      !isValidSignature(
        signature
      )
    ) {
      throw new SigningError(
        "Invalid signature"
      );
    }

    const parsed =
      Signature.from(
        signature
      );

    return {
      r: parsed.r,
      s: parsed.s,
      v: parsed.v,
    };
  } catch (error) {
    throw new SigningError(
      `Signature splitting failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Normalize Signature
 * ---------------------------------------------------------------------
 * Useful for:
 * deterministic comparisons.
 */

export function normalizeSignature(
  signature: string
): string {
  if (
    !isValidSignature(
      signature
    )
  ) {
    throw new SigningError(
      "Invalid signature"
    );
  }

  return signature.toLowerCase();
}

/**
 * ---------------------------------------------------------------------
 * Compare Signatures
 * ---------------------------------------------------------------------
 */

export function signaturesEqual(
  a: string,
  b: string
): boolean {
  return (
    normalizeSignature(a) ===
    normalizeSignature(b)
  );
}