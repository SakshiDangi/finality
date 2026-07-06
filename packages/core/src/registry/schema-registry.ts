import type {
  MessageType,
} from "./message-registry.js";

/* =========================================
 * SCHEMA VALIDATOR
 * =======================================*/

/**
 * Deterministic payload validator.
 */
export type SchemaValidator =
  (
    payload:
      unknown,
  ) => boolean;

/* =========================================
 * SCHEMA DEFINITION
 * =======================================*/

/**
 * Immutable schema registration.
 */
export interface SchemaDefinition {
  /**
   * Canonical message type.
   */
  messageType:
    MessageType;

  /**
   * Schema version.
   */
  version:
    string;

  /**
   * Runtime validator.
   */
  validate:
    SchemaValidator;

  /**
   * Optional schema description.
   */
  description?:
    string;

  /**
   * Optional wrapper source.
   */
  wrapper?:
    string;
}

/* =========================================
 * VALIDATION RESULT
 * =======================================*/

export interface SchemaValidationResult {
  /**
   * Validation success state.
   */
  success:
    boolean;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}


/* =========================================
 * REGISTRY ERRORS
 * =======================================*/

export enum SchemaRegistryError {
  /**
   * Schema already exists.
   */
  DUPLICATE_SCHEMA =
    "DUPLICATE_SCHEMA",

  /**
   * Schema not found.
   */
  UNKNOWN_SCHEMA =
    "UNKNOWN_SCHEMA",
}


/* =========================================
 * REGISTRATION RESULT
 * =======================================*/

export interface SchemaRegistrationResult {
  /**
   * Registration success state.
   */
  success:
    boolean;

  /**
   * Failure classification.
   */
  error?:
    SchemaRegistryError;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * SCHEMA REGISTRY
 * =======================================*/

/**
 * Deterministic schema registry.
 *
 * Responsible for:
 *
 * - payload validation
 * - schema resolution
 * - wrapper extensibility
 * - runtime validation
 */
export class SchemaRegistry {
  /**
   * Registered schemas.
   */
  private readonly schemas =
    new Map<
      MessageType,
      SchemaDefinition
    >();
  /* =====================================
   * REGISTRATION
   * ===================================*/

  /**
   * Register protocol schema.
   */
  register(
    definition:
      SchemaDefinition,
  ): SchemaRegistrationResult {

    if (
      this.schemas.has(
        definition.messageType,
      )
    ) {
      return {
        success: false,

        error:
          SchemaRegistryError.DUPLICATE_SCHEMA,

        reason:
          `Schema already registered: ${definition.messageType}`,
      };
    }

    this.schemas.set(
      definition.messageType,
      Object.freeze({
        ...definition,
      }),
    );

    return {
      success: true,
    };
  }
  /* =====================================
   * VALIDATION
   * ===================================*/

  /**
   * Validate protocol payload.
   */
  validate(
    messageType:
      MessageType,

    payload:
      unknown,
  ): SchemaValidationResult {

    const schema =
      this.schemas.get(
        messageType,
      );

    if (!schema) {
      return {
        success: false,

        reason:
          `Unknown schema: ${messageType}`,
      };
    }

    const valid =
      schema.validate(
        payload,
      );

    if (!valid) {
      return {
        success: false,

        reason:
          `Payload validation failed for ${messageType}`,
      };
    }

    return {
      success: true,
    };
  }
  /* =====================================
   * LOOKUP
   * ===================================*/

  /**
   * Retrieve schema definition.
   */
  get(
    messageType:
      MessageType,
  ):
    | SchemaDefinition
    | undefined {

    return this.schemas.get(
      messageType,
    );
  }

  /**
   * Detect registered schema.
   */
  has(
    messageType:
      MessageType,
  ): boolean {

    return this.schemas.has(
      messageType,
    );
  }
  /* =====================================
   * COLLECTION
   * ===================================*/

  /**
   * Total schemas.
   */
  size():
    number {

    return this.schemas.size;
  }

  /**
   * Registered schema keys.
   */
  keys():
    readonly MessageType[] {

    return [
      ...this.schemas.keys(),
    ];
  }

  /**
   * Registered schemas.
   */
  values():
    readonly SchemaDefinition[] {

    return [
      ...this.schemas.values(),
    ];
  }

  /**
   * Registered entries.
   */
  entries():
    readonly (
      readonly [
        MessageType,
        SchemaDefinition,
      ]
    )[] {

    return [
      ...this.schemas.entries(),
    ];
  }

  /**
   * Reset registry.
   */
  clear():
    void {

    this.schemas.clear();
  }
}