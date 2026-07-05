import type {
  Envelope,
} from "../base/envelope.js";

import type {
  PrivateKey,
  PublicKey,
} from "../base/primitives.js";

import type {
  ExecutionContext,
} from "./context.js";

import {
  verifyRequest,
  type RequestVerifierContext,
} from "./request-verifier.js";

import {
  executeRequest,
} from "./request-executor.js";

import {
  settleRequest,
} from "./request-settlement.js";

import {
  attestSettlement,
} from "./request-attestation.js";

import {
  ProtocolState,
} from "../state/transitions.js";

/* =========================================
 * ENGINE OPTIONS
 * =======================================*/

export interface ProtocolEngineOptions {

  /**
   * Validator identifier.
   */
  validator: string;

  /**
   * Validator public key.
   */
  publicKey: PublicKey;

  /**
   * Validator signing key.
   */
  privateKey: PrivateKey;

  /**
   * Verification context.
   */
  verifier:
    RequestVerifierContext;
}

/* =========================================
 * ENGINE RESULT
 * =======================================*/

export interface ProtocolEngineResult {

  /**
   * Overall pipeline success.
   */
  success: boolean;

  /**
   * Verification output.
   */
  verification?: ReturnType<
    typeof verifyRequest
  >;

  /**
   * Execution output.
   */
  execution?: Awaited<
    ReturnType<
      typeof executeRequest
    >
  >;

  /**
   * Settlement output.
   */
  settlement?: Awaited<
    ReturnType<
      typeof settleRequest
    >
  >;

  /**
   * Validator attestation.
   */
  attestation?: ReturnType<
    typeof attestSettlement
  >;

  /**
   * Final lifecycle state.
   */
  finalState:
    ProtocolState;

  /**
   * Failure reason.
   */
  reason?:
    string;
}

/* =========================================
 * PROTOCOL ENGINE
 * =======================================*/

/**
 * Executes the complete protocol lifecycle.
 *
 * Flow
 *
 * Envelope
 *   ↓
 * Verify
 *   ↓
 * Execute
 *   ↓
 * Settle
 *   ↓
 * Attest
 *   ↓
 * Finalize
 */
export async function runProtocol(

  context:
    ExecutionContext,

  options:
    ProtocolEngineOptions,

): Promise<
  ProtocolEngineResult
> {

  const {
    envelope,
    stateMachine,
  } = context;

  /* =====================================
   * VERIFY
   * ===================================*/

  const verification =
    verifyRequest(
      envelope,
      options.verifier,
    );

  if (!verification.success) {

    stateMachine.transition(
      ProtocolState.REJECTED,
    );

    return {

      success: false,

      verification,

      finalState:
        stateMachine.getState(),

      reason:
        verification.reason,

    };

  }

  stateMachine.transition(
    ProtocolState.VERIFIED,
  );

  stateMachine.transition(
    ProtocolState.REPLAY_CHECKED,
  );

  /* =====================================
   * EXECUTE
   * ===================================*/

  const execution =
    await executeRequest(
      context,
    );

  if (!execution.success) {

    stateMachine.transition(
      ProtocolState.REJECTED,
    );

    return {

      success: false,

      verification,

      execution,

      finalState:
        stateMachine.getState(),

      reason:
        execution.errorMessage,

    };

  }

  /* =====================================
   * SETTLEMENT
   * ===================================*/

  const settlement =
    await settleRequest(
      context,
      execution,
    );

  if (!settlement.success) {

    stateMachine.transition(
      ProtocolState.REJECTED,
    );

    return {

      success: false,

      verification,

      execution,

      settlement,

      finalState:
        stateMachine.getState(),

      reason:
        settlement.reason,

    };

  }

  /* =====================================
   * ATTESTATION
   * ===================================*/

  const attestation =
    attestSettlement(

      settlement.receipt,

      options.validator,

      options.publicKey,

      options.privateKey,

    );

  if (!attestation.success) {

    stateMachine.transition(
      ProtocolState.REJECTED,
    );

    return {

      success: false,

      verification,

      execution,

      settlement,

      attestation,

      finalState:
        stateMachine.getState(),

      reason:
        attestation.reason,

    };

  }

  /* =====================================
   * FINALIZE
   * ===================================*/

  stateMachine.transition(
    ProtocolState.FINALIZED,
  );

  return {

    success: true,

    verification,

    execution,

    settlement,

    attestation,

    finalState:
      stateMachine.getState(),

  };

}