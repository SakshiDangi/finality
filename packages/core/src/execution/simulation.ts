import type {
  Envelope,
} from "../base/envelope.js";

import type {
  PrivateKey,
  PublicKey,
} from "../base/primitives.js";

import {
  HandlerRegistry,
} from "./handlers.js";

import {
  ProtocolStateMachine,
} from "../state/state-machine.js";

import {
  SettlementEngine,
} from "../state/settlement.js";

import {
  createExecutionContext,
} from "./context.js";

import {
  createSigningDigest,
} from "../verification/signature.js";

import {
  runProtocol,
  type ProtocolEngineResult,
} from "./protocol-engine.js";

import type {
  RequestVerifierContext,
} from "./request-verifier.js";

/* =========================================
 * SIMULATION OPTIONS
 * =======================================*/

export interface SimulationOptions {

  /**
   * Protocol envelope.
   */
  envelope:
    Envelope;

  /**
   * Validator identity.
   */
  validator:
    string;

  /**
   * Validator public key.
   */
  publicKey:
    PublicKey;

  /**
   * Validator private key.
   */
  privateKey:
    PrivateKey;

  /**
   * Verification context.
   */
  verifier:
    RequestVerifierContext;
}

/* =========================================
 * SIMULATION RESULT
 * =======================================*/

export interface SimulationResult {

  /**
   * Simulation success.
   */
  success:
    boolean;

  /**
   * Engine output.
   */
  engine:
    ProtocolEngineResult;

  /**
   * Runtime duration.
   */
  durationMs:
    number;
}

/* =========================================
 * PROTOCOL SIMULATION
 * =======================================*/

/**
 * Executes a complete deterministic
 * protocol simulation.
 *
 * This is intended for:
 *
 * - local testing
 * - validator testing
 * - benchmarks
 * - demos
 * - integration tests
 */
export async function simulateProtocol(
  options:
    SimulationOptions,
): Promise<
  SimulationResult
> {

  const startedAt =
    Date.now();

  /* =====================================
   * BUILD RUNTIME
   * ===================================*/

  const handlers =
    new HandlerRegistry();

  /**
   * Register a demo handler.
   *
   * Applications typically replace
   * this with their own handlers.
   */
  handlers.register(
    "noop",
    async () => ({
      success: true,
      result: {
        message:
          "Simulation completed",
      },
    }),
  );

  const context =
    createExecutionContext({

      envelope:
        options.envelope,

      digest:
        createSigningDigest(
          options.envelope,
        ),

      stateMachine:
        new ProtocolStateMachine(),

      settlement:
        new SettlementEngine(),

      handlers:
        new Map(
          handlers
            .getActions()
            .map(action => [
              action,
              handlers.getHandler(action)!,
            ]),
        ),

      metadata: {

        executionId:
          crypto.randomUUID(),

        startedAt,

      },

    });

  /* =====================================
   * RUN ENGINE
   * ===================================*/

  const engine =
    await runProtocol(
      context,
      {

        validator:
          options.validator,

        publicKey:
          options.publicKey,

        privateKey:
          options.privateKey,

        verifier:
          options.verifier,

      },
    );

  return {

    success:
      engine.success,

    engine,

    durationMs:
      Date.now() - startedAt,

  };

}