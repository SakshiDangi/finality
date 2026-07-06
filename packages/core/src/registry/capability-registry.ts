import type {
  MessageType,
} from "./message-registry.js";

/* =========================================
 * CAPABILITY ID
 * =======================================*/

/**
 * Canonical protocol capability.
 */
export type CapabilityId =
  string;

/* =========================================
 * CAPABILITY DEFINITION
 * =======================================*/

/**
 * Immutable protocol capability.
 */
export interface CapabilityDefinition {
  /**
   * Capability identifier.
   */
  id:
    CapabilityId;

  /**
   * Human-readable description.
   */
  description:
    string;

  /**
   * Supported message types.
   */
  messageTypes?:
    readonly MessageType[];

  /**
   * Optional wrapper source.
   */
  wrapper?:
    string;
}


/* =========================================
 * REGISTRY ERRORS
 * =======================================*/

export enum CapabilityRegistryError {
  /**
   * Capability already exists.
   */
  DUPLICATE_CAPABILITY =
    "DUPLICATE_CAPABILITY",

  /**
   * Capability not found.
   */
  UNKNOWN_CAPABILITY =
    "UNKNOWN_CAPABILITY",
}

/* =========================================
 * REGISTRATION RESULT
 * =======================================*/

export interface CapabilityRegistrationResult {
  /**
   * Registration success state.
   */
  success:
    boolean;

  /**
   * Failure classification.
   */
  error?:
    CapabilityRegistryError;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * CAPABILITY REGISTRY
 * =======================================*/

/**
 * Deterministic capability registry.
 *
 * Responsible for:
 *
 * - capability discovery
 * - feature negotiation
 * - wrapper compatibility
 * - distributed coordination
 */
export class CapabilityRegistry {
  /**
   * Registered capabilities.
   */
  private readonly capabilities =
    new Map<
      CapabilityId,
      CapabilityDefinition
    >();
      /* =====================================
   * REGISTRATION
   * ===================================*/

  /**
   * Register protocol capability.
   */
  register(
    definition:
      CapabilityDefinition,
  ): CapabilityRegistrationResult {

    if (
      this.capabilities.has(
        definition.id,
      )
    ) {
      return {
        success: false,

        error:
          CapabilityRegistryError.DUPLICATE_CAPABILITY,

        reason:
          `Capability already registered: ${definition.id}`,
      };
    }

    this.capabilities.set(
      definition.id,
      Object.freeze({
        ...definition,
      }),
    );

    return {
      success: true,
    };
  }
    /* =====================================
   * LOOKUP
   * ===================================*/

  /**
   * Retrieve capability definition.
   */
  get(
    id:
      CapabilityId,
  ):
    | CapabilityDefinition
    | undefined {

    return this.capabilities.get(
      id,
    );
  }

  /**
   * Detect registered capability.
   */
  has(
    id:
      CapabilityId,
  ): boolean {

    return this.capabilities.has(
      id,
    );
  }
    /* =====================================
   * MESSAGE CAPABILITIES
   * ===================================*/

  /**
   * Retrieve capabilities
   * supporting message type.
   */
  getByMessageType(
    messageType:
      MessageType,
  ):
    readonly CapabilityDefinition[] {

    return this
      .values()
      .filter(
        (
          capability,
        ) =>
          capability
            .messageTypes
            ?.includes(
              messageType,
            ) ?? false,
      );
  }
    /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total capabilities.
   */
  size():
    number {

    return this.capabilities.size;
  }

  /**
   * Capability identifiers.
   */
  keys():
    readonly CapabilityId[] {

    return [
      ...this.capabilities.keys(),
    ];
  }

  /**
   * Capability definitions.
   */
  values():
    readonly CapabilityDefinition[] {

    return [
      ...this.capabilities.values(),
    ];
  }

  /**
   * Capability entries.
   */
  entries():
    readonly (
      readonly [
        CapabilityId,
        CapabilityDefinition,
      ]
    )[] {

    return [
      ...this.capabilities.entries(),
    ];
  }

  /**
   * Reset registry.
   */
  clear():
    void {

    this.capabilities.clear();
  }
}