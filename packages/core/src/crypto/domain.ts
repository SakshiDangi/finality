/**
 * Protocol signing domains.
 *
 * Domains provide cryptographic
 * separation between:
 *
 * - environments
 * - applications
 * - wrappers
 * - message classes
 * - protocol layers
 *
 * Critical for preventing:
 * - replay attacks
 * - cross-protocol signing abuse
 * - signature confusion
 * - environment leakage
 */

/**
 * Core protocol signing domains.
 */
export const PROTOCOL_DOMAIN = {
  /**
   * Main protocol domain.
   */
  CORE:
    "FINALITY_CORE_V1",

  /**
   * Settlement operations.
   */
  SETTLEMENT:
    "FINALITY_SETTLEMENT_V1",

  /**
   * Validator attestations.
   */
  ATTESTATION:
    "FINALITY_ATTESTATION_V1",

  /**
   * Synchronization messages.
   */
  SYNCHRONIZATION:
    "FINALITY_SYNCHRONIZATION_V1",

  /**
   * Replay protection subsystem.
   */
  REPLAY:
    "FINALITY_REPLAY_V1",
} as const;

/**
 * Wrapper/application domains.
 *
 * Wrapper applications MUST use
 * isolated signing domains.
 */
export const WRAPPER_DOMAIN = {
  TETHER:
    "FINALITY_TETHER_WRAPPER_V1",

  CROO:
    "FINALITY_CROO_WRAPPER_V1",

  BRIDGE:
    "FINALITY_BRIDGE_WRAPPER_V1",
} as const;

/**
 * Runtime environment domains.
 *
 * Prevents:
 * - testnet replay into mainnet
 * - staging replay into production
 */
export const ENVIRONMENT_DOMAIN = {
  LOCAL:
    "LOCAL",

  DEVELOPMENT:
    "DEVELOPMENT",

  STAGING:
    "STAGING",

  PRODUCTION:
    "PRODUCTION",
} as const;

/**
 * Protocol domain type.
 */
export type ProtocolDomain =
  typeof PROTOCOL_DOMAIN[
    keyof typeof PROTOCOL_DOMAIN
  ];

/**
 * Wrapper domain type.
 */
export type WrapperDomain =
  typeof WRAPPER_DOMAIN[
    keyof typeof WRAPPER_DOMAIN
  ];

/**
 * Environment domain type.
 */
export type EnvironmentDomain =
  typeof ENVIRONMENT_DOMAIN[
    keyof typeof ENVIRONMENT_DOMAIN
  ];

/**
 * Full signing domain.
 */
export interface SigningDomain {
  /**
   * Core protocol domain.
   */
  protocol:
    ProtocolDomain;

  /**
   * Runtime environment.
   */
  environment:
    EnvironmentDomain;

  /**
   * Optional wrapper isolation.
   */
  wrapper?:
    WrapperDomain;

  /**
   * Protocol version.
   */
  version: string;
}

/**
 * Creates deterministic
 * signing domain string.
 *
 * This becomes part of:
 * - signing payloads
 * - hashes
 * - attestations
 * - replay boundaries
 */
export function createSigningDomain(
  domain: SigningDomain,
): string {
  return [
    domain.protocol,
    domain.environment,
    domain.wrapper,
    domain.version,
  ]
    .filter(Boolean)
    .join(":");
}

/**
 * Default core protocol domain.
 */
export const DEFAULT_SIGNING_DOMAIN:
  SigningDomain = {
  protocol:
    PROTOCOL_DOMAIN.CORE,

  environment:
    ENVIRONMENT_DOMAIN.DEVELOPMENT,

  version:
    "1.0.0",
};

/**
 * Creates wrapper-isolated domain.
 *
 * Critical for preventing
 * cross-wrapper replay attacks.
 */
export function createWrapperDomain(
  wrapper: WrapperDomain,
  environment:
    EnvironmentDomain =
      ENVIRONMENT_DOMAIN.DEVELOPMENT,
): SigningDomain {
  return {
    protocol:
      PROTOCOL_DOMAIN.CORE,

    environment,

    wrapper,

    version:
      "1.0.0",
  };
}

/**
 * Validates signing domain structure.
 */
export function isValidSigningDomain(
  value: unknown,
): value is SigningDomain {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as SigningDomain;

  return (
    typeof candidate.protocol ===
      "string" &&
    typeof candidate.environment ===
      "string" &&
    typeof candidate.version ===
      "string"
  );
}