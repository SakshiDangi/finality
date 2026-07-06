import type {
  MessageType,
} from "./message-registry.js";

import type {
  CapabilityId,
} from "./capability-registry.js";

/* =========================================
 * WRAPPER ID
 * =======================================*/

/**
 * Canonical wrapper identifier.
 */
export type WrapperId =
  string;

/* =========================================
 * WRAPPER DEFINITION
 * =======================================*/

/**
 * Immutable protocol wrapper.
 *
 * Represents external protocol
 * extensibility module.
 */
export interface WrapperDefinition {
  /**
   * Wrapper identifier.
   */
  id:
    WrapperId;

  /**
   * Human-readable name.
   */
  name:
    string;

  /**
   * Wrapper version.
   */
  version:
    string;

  /**
   * Supported message types.
   */
  messageTypes:
    readonly MessageType[];

  /**
   * Supported capabilities.
   */
  capabilities:
    readonly CapabilityId[];

  /**
   * Optional description.
   */
  description?:
    string;
}

/* =========================================
 * REGISTRY ERRORS
 * =======================================*/

export enum WrapperRegistryError {
  /**
   * Wrapper already exists.
   */
  DUPLICATE_WRAPPER =
    "DUPLICATE_WRAPPER",

  /**
   * Wrapper not found.
   */
  UNKNOWN_WRAPPER =
    "UNKNOWN_WRAPPER",
}

/* =========================================
 * REGISTRATION RESULT
 * =======================================*/

export interface WrapperRegistrationResult {
  /**
   * Registration success state.
   */
  success:
    boolean;

  /**
   * Failure classification.
   */
  error?:
    WrapperRegistryError;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * WRAPPER REGISTRY
 * =======================================*/

/**
 * Deterministic wrapper registry.
 *
 * Responsible for:
 *
 * - protocol extensibility
 * - wrapper discovery
 * - capability integration
 * - external protocol modules
 */
export class WrapperRegistry {
  /**
   * Registered wrappers.
   */
  private readonly wrappers =
    new Map<
      WrapperId,
      WrapperDefinition
    >();
      /* =====================================
   * REGISTRATION
   * ===================================*/

  /**
   * Register protocol wrapper.
   */
  register(
    definition:
      WrapperDefinition,
  ): WrapperRegistrationResult {

    if (
      this.wrappers.has(
        definition.id,
      )
    ) {
      return {
        success: false,

        error:
          WrapperRegistryError.DUPLICATE_WRAPPER,

        reason:
          `Wrapper already registered: ${definition.id}`,
      };
    }

    this.wrappers.set(
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
   * Retrieve wrapper definition.
   */
  get(
    id:
      WrapperId,
  ):
    | WrapperDefinition
    | undefined {

    return this.wrappers.get(
      id,
    );
  }

  /**
   * Detect registered wrapper.
   */
  has(
    id:
      WrapperId,
  ): boolean {

    return this.wrappers.has(
      id,
    );
  }
    /* =====================================
   * MESSAGE LOOKUP
   * ===================================*/

  /**
   * Retrieve wrappers supporting
   * message type.
   */
  getByMessageType(
    messageType:
      MessageType,
  ):
    readonly WrapperDefinition[] {

    return this
      .values()
      .filter(
        (
          wrapper,
        ) =>
          wrapper
            .messageTypes
            .includes(
              messageType,
            ),
      );
  }
    /* =====================================
   * CAPABILITY LOOKUP
   * ===================================*/

  /**
   * Retrieve wrappers supporting
   * capability.
   */
  getByCapability(
    capability:
      CapabilityId,
  ):
    readonly WrapperDefinition[] {

    return this
      .values()
      .filter(
        (
          wrapper,
        ) =>
          wrapper
            .capabilities
            .includes(
              capability,
            ),
      );
  }
    /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total wrappers.
   */
  size():
    number {

    return this.wrappers.size;
  }

  /**
   * Wrapper identifiers.
   */
  keys():
    readonly WrapperId[] {

    return [
      ...this.wrappers.keys(),
    ];
  }

  /**
   * Wrapper definitions.
   */
  values():
    readonly WrapperDefinition[] {

    return [
      ...this.wrappers.values(),
    ];
  }

  /**
   * Wrapper entries.
   */
  entries():
    readonly (
      readonly [
        WrapperId,
        WrapperDefinition,
      ]
    )[] {

    return [
      ...this.wrappers.entries(),
    ];
  }

  /**
   * Reset registry.
   */
  clear():
    void {

    this.wrappers.clear();
  }
}