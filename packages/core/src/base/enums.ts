import { z } from "zod";

/* =========================================
 * MESSAGE KIND
 * =======================================*/

export const MESSAGE_KIND = {
  REQUEST: "REQUEST",
  RESPONSE: "RESPONSE",
} as const;

export const MessageKindSchema =
  z.enum([
    MESSAGE_KIND.REQUEST,
    MESSAGE_KIND.RESPONSE,
  ]);

export type MessageKind =
  z.infer<typeof MessageKindSchema>;

/* =========================================
 * REQUEST STATE
 * =======================================*/

export const REQUEST_STATE = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

export const RequestStateSchema =
  z.enum([
    REQUEST_STATE.PENDING,
    REQUEST_STATE.ACCEPTED,
    REQUEST_STATE.REJECTED,
  ]);

export type RequestState =
  z.infer<typeof RequestStateSchema>;

/* =========================================
 * VERIFICATION STATUS
 * =======================================*/

export const VERIFICATION_STATUS = {
  VALID: "VALID",
  INVALID: "INVALID",
} as const;

export const VerificationStatusSchema =
  z.enum([
    VERIFICATION_STATUS.VALID,
    VERIFICATION_STATUS.INVALID,
  ]);

export type VerificationStatus =
  z.infer<typeof VerificationStatusSchema>;

/* =========================================
 * SIGNATURE ALGORITHM
 * =======================================*/

export const SIGNATURE_ALGORITHM = {
  SECP256K1: "SECP256K1",
  ED25519: "ED25519",
} as const;

export const SignatureAlgorithmSchema =
  z.enum([
    SIGNATURE_ALGORITHM.SECP256K1,
    SIGNATURE_ALGORITHM.ED25519,
  ]);

export type SignatureAlgorithm =
  z.infer<typeof SignatureAlgorithmSchema>;

/* =========================================
 * PACKET PRIORITY
 * =======================================*/

export const PACKET_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export const PacketPrioritySchema =
  z.enum([
    PACKET_PRIORITY.LOW,
    PACKET_PRIORITY.NORMAL,
    PACKET_PRIORITY.HIGH,
    PACKET_PRIORITY.CRITICAL,
  ]);

export type PacketPriority =
  z.infer<typeof PacketPrioritySchema>;

/* =========================================
 * SYNCHRONIZATION STATUS
 * =======================================*/

export const SYNCHRONIZATION_STATUS = {
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  OUT_OF_SYNC: "OUT_OF_SYNC",
} as const;

export const SynchronizationStatusSchema =
  z.enum([
    SYNCHRONIZATION_STATUS.SYNCING,
    SYNCHRONIZATION_STATUS.SYNCED,
    SYNCHRONIZATION_STATUS.OUT_OF_SYNC,
  ]);

export type SynchronizationStatus =
  z.infer<typeof SynchronizationStatusSchema>;