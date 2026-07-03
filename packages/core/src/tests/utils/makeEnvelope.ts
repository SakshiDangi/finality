import type { Envelope } from "../../base/envelope.js";
import {
  MESSAGE_KIND,
  PACKET_PRIORITY,
  SIGNATURE_ALGORITHM,
} from "../../base/enums.js";

export function makeEnvelope(
    overrides: Partial<Envelope> = {},
): Envelope {
  return {
    header: {
      messageId: "msg-1",
      domain: "FINALITY_CORE_V1",

      messageKind:
        MESSAGE_KIND.REQUEST,

      sender:
        "0x1111111111111111111111111111111111111111",

      timestamp: Date.now(),

      nonce: 1,

      sequence: 1,

      ttl: 30000,

      signatureAlgorithm:
        SIGNATURE_ALGORITHM.SECP256K1,

      priority:
        PACKET_PRIORITY.NORMAL,

      protocol: "FINALITY",

      version: "1.0.0",
    },

    payload: {
      amount: 100,
      asset: "USDC",
    },

    signature:
      ("0x" + "00".repeat(64)) as `0x${string}`,

    metadata: {},
  };
}