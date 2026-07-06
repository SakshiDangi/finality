import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import {
  type UnsignedEnvelope,
} from "../base/envelope.js";

import {
  createSigningDigest,
} from "../verification/signature.js";

import type {
  SignatureHex as Signature,
  PrivateKey,
  PublicKey,
} from "../base/primitives.js";

/**
 * Convert hex string into bytes.
 */
function hexToBytes(
  value: string,
): Uint8Array {
  const normalized =
    value.startsWith("0x")
      ? value.slice(2)
      : value;

  return Uint8Array.from(
    Buffer.from(normalized, "hex"),
  );
}


export function signDigest(
digest: string,
privateKey: PrivateKey,
): Signature {
const signature =
secp256k1.sign(
hexToBytes(digest),
hexToBytes(privateKey),
);

return `0x${bytesToHex(
    signature,
  )}`;
}



/**
 * Sign arbitrary payload. (header + payload)
 *
 * payload
 * -> canonicalizeEnvelope()
 * -> protocolHash()
 * -> secp256k1.sign()
 */

export function signEnvelope(
envelope: UnsignedEnvelope,
privateKey: PrivateKey,
): Signature {
const digest =
createSigningDigest(
envelope,
);

return signDigest(
digest,
privateKey,
);
}


/**
 * Verify payload signature. (multiple signing boundaries)
 */
export function verifyDigestSignature(
digest: string,
signature: Signature,
publicKey: PublicKey,
): boolean {
try {
return secp256k1.verify(
hexToBytes(signature),
hexToBytes(digest),
hexToBytes(publicKey),
);
} catch {
return false;
}
}


/**
 * Generate public key
 * from private key.
 */
export function derivePublicKey(
  privateKey: PrivateKey,
): PublicKey {
  const publicKey =
    secp256k1.getPublicKey(
      hexToBytes(privateKey),
    );

  return `0x${bytesToHex(publicKey)}`;
}


// verification/signature.ts
//     owns:
//       canonicalization
//       digest generation
//       signing boundaries

// crypto/signatures.ts
//     owns:
//       raw secp256k1 operations