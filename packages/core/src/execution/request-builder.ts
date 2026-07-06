import type {
  UnsignedEnvelope,
  EnvelopePayload,
  EnvelopeMetadata,
} from "../base/envelope.js";

import type {
  MessageKind,
  PacketPriority,
  SignatureAlgorithm,
} from "../base/enums.js";

import type {
  ProtocolAddress,
  PublicKey,
} from "../base/primitives.js";

/* =========================================
 * REQUEST BUILDER INPUT
 * =======================================*/

/**
 * Canonical request builder input.
 *
 * Represents normalized application
 * input before signing.
 */
export interface RequestBuilderInput {
  /**
   * Protocol domain separator.
   */
  domain:
    string;

  /**
   * REQUEST | RESPONSE
   */
  messageKind:
    MessageKind;

  /**
   * Canonical sender identity.
   */
  sender:
    ProtocolAddress;

  /**
   * Sender public key.
   */
  publicKey:
    PublicKey;

  /**
   * Replay protection nonce.
   */
  nonce:
    number;

  /**
   * Packet ordering sequence.
   */
  sequence:
    number;

  /**
   * Application payload.
   */
  payload:
    EnvelopePayload;

  /**
   * Optional metadata.
   */
  metadata?:
    EnvelopeMetadata;

  /**
   * Optional packet priority.
   */
  priority?:
    PacketPriority;

  /**
   * Optional TTL.
   */
  ttl?:
    number;

  /**
   * Optional signature algorithm.
   */
  signatureAlgorithm?:
    SignatureAlgorithm;

  /**
   * Optional protocol identifier.
   */
  protocol?:
    string;

  /**
   * Optional semantic version.
   */
  version?:
    string;

  /**
   * Deterministic runtime time.
   */
  currentTime:
    number;
}

/* =========================================
 * MESSAGE ID GENERATION
 * =======================================*/

/**
 * Creates deterministic message ID.
 *
 * Future versions may replace this
 * with:
 *
 * - ULIDs
 * - UUIDv7
 * - distributed sequence IDs
 * - validator-generated IDs
 */
export function createMessageId():
  string {
  return crypto.randomUUID();
}

/* =========================================
 * REQUEST BUILDER
 * =======================================*/

/**
 * Builds canonical unsigned envelope.
 *
 * Guarantees deterministic protocol
 * transport structure before signing.
 */
export function buildRequest(
  input:
    RequestBuilderInput,
): UnsignedEnvelope {
  return {
    header: {
      messageId:
        createMessageId(),

      domain:
        input.domain,

      messageKind:
        input.messageKind,

      sender:
        input.sender,

      publicKey:
        input.publicKey,

      timestamp:
        input.currentTime,

      nonce:
        input.nonce,

      sequence:
        input.sequence,

      ttl:
        input.ttl
        ?? 30_000,

      signatureAlgorithm:
        input.signatureAlgorithm
        ?? "SECP256K1",

      priority:
        input.priority
        ?? "NORMAL",

      protocol:
        input.protocol
        ?? "FINALITY",

      version:
        input.version
        ?? "1.0.0",
    },

    payload:
      input.payload,

    metadata:
      input.metadata,
  };
}