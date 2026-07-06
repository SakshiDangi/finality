import type {
  EnvelopePayload,
} from "../base/envelope.js";

import type {
  ExecutionResult,
} from "./result.js";

import type {
  ExecutionContext,
} from "./context.js";

import {
  ExecutionError,
  ExecutionErrorSeverity,
  ExecutionErrorType,
} from "./errors.js";

/* =========================================
 * ACTION TYPES
 * =======================================*/

/**
 * Canonical protocol action.
 *
 * Represents executable
 * protocol operations.
 */
export type ExecutionAction =
  string;

/* =========================================
 * EXECUTION HANDLER
 * =======================================*/

/**
 * Deterministic execution handler.
 *
 * Responsible for executing:
 *
 * - business logic
 * - protocol actions
 * - settlement operations
 * - validator tasks
 */
export type ExecutionHandler =
  (
    context:
      ExecutionContext,

    payload:
      EnvelopePayload,
  ) => Promise<
    Partial<ExecutionResult>
  >;

/* =========================================
 * HANDLER REGISTRY
 * =======================================*/

/**
 * Deterministic execution
 * handler registry.
 *
 * Responsible for:
 *
 * - action registration
 * - handler lookup
 * - dispatch coordination
 * - execution routing
 */
export class HandlerRegistry {
  /**
   * Registered action handlers.
   */
  private readonly handlers =
    new Map<
      ExecutionAction,
      ExecutionHandler
    >();

  /* =====================================
   * REGISTRATION
   * ===================================*/

  /**
   * Register execution handler.
   */
  register(
    action:
      ExecutionAction,

    handler:
      ExecutionHandler,
  ): void {
    this.handlers.set(
      action,
      handler,
    );
  }

  /* =====================================
   * LOOKUP
   * ===================================*/

  /**
   * Retrieve execution handler.
   */
  getHandler(
    action:
      ExecutionAction,
  ):
    | ExecutionHandler
    | undefined {
    return this.handlers.get(
      action,
    );
  }

  /**
   * Detect registered handler.
   */
  hasHandler(
    action:
      ExecutionAction,
  ): boolean {
    return this.handlers.has(
      action,
    );
  }

  /* =====================================
   * EXECUTION
   * ===================================*/

  /**
   * Execute registered handler.
   */
  async execute(
    action:
      ExecutionAction,

    context:
      ExecutionContext,

    payload:
      EnvelopePayload,
  ): Promise<
    Partial<ExecutionResult>
  > {
    const handler =
      this.getHandler(
        action,
      );

    /**
     * Reject unknown actions.
     */
    if (!handler) {
      throw new ExecutionError({
        type:
          ExecutionErrorType.HANDLER_NOT_FOUND,

        severity:
          ExecutionErrorSeverity.MEDIUM,

        message:
          `No handler registered for action: ${action}`,

        metadata: {
          action,
        },
      });
    }

    /**
     * Execute deterministic handler.
     */
    return handler(
      context,
      payload,
    );
  }

  /* =====================================
   * MANAGEMENT
   * ===================================*/

  /**
   * Remove registered handler.
   */
  unregister(
    action:
      ExecutionAction,
  ): boolean {
    return this.handlers.delete(
      action,
    );
  }

  /**
   * Reset handler registry.
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Total registered handlers.
   */
  size(): number {
    return this.handlers.size;
  }

  /**
   * Registered actions.
   */
  getActions():
    readonly ExecutionAction[] {
    return [
      ...this.handlers.keys(),
    ];
  }
}