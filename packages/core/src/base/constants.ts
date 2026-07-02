export const PROTOCOL_NAME = "FINALITY_CORE";

export const PROTOCOL_VERSION = "1.0.0";

/**
 * Maximum allowed clock drift between distributed nodes.
 *
 * Example:
 * Validator A clock:
 * 10:00:00
 *
 * Validator B clock:
 * 10:00:20
 *
 * Small drift must be tolerated.
 */
export const MAX_CLOCK_DRIFT_MS = 30_000;

/**
 * Maximum packet age before rejection.
 *
 * Protects against:
 * replay attacks
 * delayed packet injection
 * stale network propagation
 */
export const MAX_PACKET_AGE_MS = 5 * 60 * 1000;

/**
 * Maximum payload size allowed by protocol.
 *
 * Prevents:
 * memory abuse
 * oversized packet attacks
 * serialization DoS vectors
 */
export const MAX_PAYLOAD_SIZE_BYTES = 256 * 1024;

/**
 * Default time-to-live for protocol packets.
 */
export const DEFAULT_TTL_MS = 60_000;

/**
 * Allowed out-of-order nonce window.
 *
 * Important for:
 * async relayers
 * distributed systems
 * packet reordering
 */
export const NONCE_WINDOW_SIZE = 128;

/**
 * Default cryptographic signature algorithm.
 */
export const DEFAULT_SIGNATURE_ALGORITHM = "SECP256K1";