import type {
  Envelope,
} from "../base/envelope.js";

import type {
  MessageDefinition,
  MessageRegistry,
  MessageType,
} from "./message-registry.js";

import type {
  SchemaRegistry,
} from "./schema-registry.js";

import type {
  WrapperRegistry,
} from "./wrapper-registry.js";

import type {
  CapabilityRegistry,
} from "./capability-registry.js";

/* =========================================
 * ROUTER CONTEXT
 * =======================================*/

/**
 * Deterministic router dependencies.
 */
export interface RouterContext {
  /**
   * Message registry.
   */
  messageRegistry:
    MessageRegistry;

  /**
   * Schema registry.
   */
  schemaRegistry:
    SchemaRegistry;

  /**
   * Capability registry.
   */
  capabilityRegistry:
    CapabilityRegistry;

  /**
   * Wrapper registry.
   */
  wrapperRegistry:
    WrapperRegistry;
}

/* =========================================
 * ROUTE RESULT
 * =======================================*/

/**
 * Deterministic routing result.
 */
export interface RouteResult {
  /**
   * Routing success state.
   */
  success:
    boolean;

  /**
   * Routed message type.
   */
  messageType?:
    MessageType;

  /**
   * Resolved message definition.
   */
  definition?:
    MessageDefinition;

  /**
   * Execution result.
   */
  result?:
    unknown;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * ROUTER
 * =======================================*/

/**
 * Deterministic protocol router.
 *
 * Responsible for:
 *
 * - message resolution
 * - schema validation
 * - handler dispatch
 * - wrapper integration
 */
export class Router {
  /**
   * Runtime registries.
   */
  private readonly context:
    RouterContext;

  constructor(
    context:
      RouterContext,
  ) {
    this.context =
      Object.freeze({
        ...context,
      });
  }
    /* =====================================
   * MESSAGE RESOLUTION
   * ===================================*/

  /**
   * Resolve envelope message type.
   */
  private resolveMessageType(
    envelope:
      Envelope,
  ): MessageType {

    return String(
      envelope.payload.type,
    );
  }
    /* =====================================
   * ROUTING
   * ===================================*/

  /**
   * Route protocol envelope.
   */
  route(
    envelope:
      Envelope,
  ): RouteResult {

    /* ===================================
     * RESOLVE MESSAGE TYPE
     * =================================*/

    const messageType =
      this.resolveMessageType(
        envelope,
      );
    /* ===================================
     * RESOLVE MESSAGE
     * =================================*/

    const definition =
      this.context
        .messageRegistry
        .get(
          messageType,
        );

    if (!definition) {
      return {
        success: false,

        reason:
          `Unknown message type: ${messageType}`,
      };
    }
    /* ===================================
     * VALIDATE PAYLOAD
     * =================================*/

    const validation =
      this.context
        .schemaRegistry
        .validate(
          messageType,
          envelope.payload,
        );

    if (!validation.success) {
      return {
        success: false,

        messageType,

        definition,

        reason:
          validation.reason,
      };
    }
    /* ===================================
     * EXECUTE HANDLER
     * =================================*/

    try {

      const result =
        definition.handler(
          envelope,
        );

      return {
        success: true,

        messageType,

        definition,

        result,
      };

    } catch (error) {

      return {
        success: false,

        messageType,

        definition,

        reason:
          error instanceof Error
            ? error.message
            : "Unknown routing failure",
      };
    }
  }
}