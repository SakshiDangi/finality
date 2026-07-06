import type {
  Envelope,
} from "../base/envelope.js";

/* =========================================
 * MESSAGE TYPE
 * =======================================*/

/**
 * Canonical protocol
 * message identifier.
 */
export type MessageType =
  string;


/* =========================================
 * MESSAGE HANDLER
 * =======================================*/

/**
 * Deterministic protocol
 * message handler.
 */
export type MessageHandler =
  (
    envelope:
      Envelope,
  ) => unknown;


/* =========================================
 * MESSAGE DEFINITION
 * =======================================*/

/**
 * Immutable protocol
 * message registration.
 */
export interface MessageDefinition {
  /**
   * Canonical message type.
   */
  type:
    MessageType;

  /**
   * Schema version.
   */
  version:
    string;

  /**
   * Runtime handler.
   */
  handler:
    MessageHandler;

  /**
   * Optional capabilities.
   */
  capabilities?:
    readonly string[];

  /**
   * Optional wrapper source.
   */
  wrapper?:
    string;
}


/* =========================================
 * REGISTRY ERRORS
 * =======================================*/

export enum MessageRegistryError {
  /**
   * Message type already exists.
   */
  DUPLICATE_MESSAGE =
    "DUPLICATE_MESSAGE",

  /**
   * Message type not found.
   */
  UNKNOWN_MESSAGE =
    "UNKNOWN_MESSAGE",
}


/* =========================================
 * REGISTRATION RESULT
 * =======================================*/

export interface MessageRegistrationResult {
  /**
   * Registration success state.
   */
  success:
    boolean;

  /**
   * Failure classification.
   */
  error?:
    MessageRegistryError;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}


/* =========================================
 * MESSAGE REGISTRY
 * =======================================*/

/**
 * Deterministic protocol
 * message registry.
 *
 * Responsible for:
 *
 * - message routing
 * - handler resolution
 * - wrapper integration
 * - protocol extensibility
 */
export class MessageRegistry {
  /**
   * Registered message definitions.
   */
  private readonly messages =
    new Map<
      MessageType,
      MessageDefinition
    >();

  /* =====================================
   * REGISTRATION
   * ===================================*/

  /**
   * Register protocol message.
   */
  register(
    definition:
      MessageDefinition,
  ): MessageRegistrationResult {

    if (
      this.messages.has(
        definition.type,
      )
    ) {
      return {
        success: false,

        error:
          MessageRegistryError.DUPLICATE_MESSAGE,

        reason:
          `Message already registered: ${definition.type}`,
      };
    }

    this.messages.set(
      definition.type,
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
   * Retrieve message definition.
   */
  get(
    type:
      MessageType,
  ):
    | MessageDefinition
    | undefined {

    return this.messages.get(
      type,
    );
  }

  /**
   * Detect registered message.
   */
  has(
    type:
      MessageType,
  ): boolean {

    return this.messages.has(
      type,
    );
  }
    /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total registered messages.
   */
  size():
    number {

    return this.messages.size;
  }

  /**
   * Registered message types.
   */
  keys():
    readonly MessageType[] {

    return [
      ...this.messages.keys(),
    ];
  }

  /**
   * Registered definitions.
   */
  values():
    readonly MessageDefinition[] {

    return [
      ...this.messages.values(),
    ];
  }

  /**
   * Registered entries.
   */
  entries():
    readonly (
      readonly [
        MessageType,
        MessageDefinition,
      ]
    )[] {

    return [
      ...this.messages.entries(),
    ];
  }

  /**
   * Reset registry.
   */
  clear():
    void {

    this.messages.clear();
  }
}