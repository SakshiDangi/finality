import type {
  Envelope,
} from "../../base/envelope.js";

import {
  createIdentity,
} from "../../crypto/identity.js";

export function makeEnvelope(): Envelope {
  const identity =
    createIdentity();

  return {
    header: {
      messageId:
        crypto.randomUUID(),

      domain:
        "FINALITY_CORE_V1",

      messageKind:
        "REQUEST",

      sender:
        identity.address,

      publicKey:
        identity.publicKey,

      timestamp:
        Date.now(),

      nonce:
        1,

      sequence:
        0,

      ttl:
        30_000,

      signatureAlgorithm:
        "SECP256K1",

      priority:
        "NORMAL",

      protocol:
        "FINALITY",

      version:
        "1.0.0",
    },

    payload: {
      amount:
        100,

      asset:
        "USDC",
    },

    signature:
      "0x00",
  };
}