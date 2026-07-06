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

import {
  ConsensusEngine,
} from "../state/consensus.js";

import {
  FinalityStatus,
} from "../state/finality.js";

/* =========================================
 * ENGINE OPTIONS
 * =======================================*/

/**
 * Deterministic protocol
 * runtime configuration.
 */
export interface ProtocolEngineOptions {

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
   * Validator signing key.
   */
  privateKey:
    PrivateKey;

  /**
   * Request verification context.
   */
  verifier:
    RequestVerifierContext;

  /**
   * Distributed consensus engine.
   */
  consensus:
    ConsensusEngine;
}

/* =========================================
 * ENGINE RESULT
 * =======================================*/

/**
 * Canonical protocol
 * execution result.
 */
export interface ProtocolEngineResult {

  /**
   * Pipeline success state.
   */
  success:
    boolean;

  /**
   * Verification result.
   */
  verification?:
    ReturnType<
      typeof verifyRequest
    >;

  /**
   * Execution result.
   */
  execution?:
    Awaited<
      ReturnType<
        typeof executeRequest
      >
    >;

  /**
   * Settlement result.
   */
  settlement?:
    Awaited<
      ReturnType<
        typeof settleRequest
      >
    >;

  /**
   * Validator attestation.
   */
  attestation?:
    ReturnType<
      typeof attestSettlement
    >;

  /**
   * Distributed consensus result.
   */
  consensus?:
    ReturnType<
      ConsensusEngine["evaluate"]
    >;

  /**
   * Final lifecycle state.
   */
  finalState:
    ProtocolState;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}

/* =========================================
 * PROTOCOL ENGINE
 * =======================================*/

/**
 * Executes complete deterministic
 * protocol lifecycle.
 *
 * Flow:
 *
 * RECEIVE
 * -> VERIFY
 * -> REPLAY CHECK
 * -> EXECUTE
 * -> SETTLE
 * -> ATTEST
 * -> CONSENSUS
 * -> FINALIZE
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
    stateMachine,
  } = context;

  /* =====================================
   * STEP 1
   * VERIFY REQUEST
   * ===================================*/

  const verification =
    verifyRequest(
      context.envelope,
      options.verifier,
    );

  if (
    !verification.success
  ) {

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

  /* =====================================
   * STEP 2
   * REPLAY VALIDATION
   * ===================================*/

  stateMachine.transition(
    ProtocolState.REPLAY_CHECKED,
  );

  /* =====================================
   * STEP 3
   * EXECUTE REQUEST
   * ===================================*/

  const execution =
    await executeRequest(
      context,
    );

  if (
    !execution.success
  ) {

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

  stateMachine.transition(
    ProtocolState.EXECUTED,
  );

  /* =====================================
   * STEP 4
   * SETTLE REQUEST
   * ===================================*/

  const settlement =
    await settleRequest(
      context,
      execution,
    );

  if (
    !settlement.success
  ) {

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

  stateMachine.transition(
    ProtocolState.SETTLED,
  );

  /* =====================================
   * STEP 5
   * PRODUCE ATTESTATION
   * ===================================*/

  const attestation =
    attestSettlement(

      settlement.receipt,

      options.validator,

      options.publicKey,

      options.privateKey,
    );

  if (
    !attestation.success
  ) {

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

  stateMachine.transition(
    ProtocolState.ATTESTED,
  );

  /* =====================================
   * STEP 6
   * DISTRIBUTED CONSENSUS
   * ===================================*/

  const consensus =
    options.consensus.evaluate(

      [
        options.validator,
      ],

      stateMachine.getState(),
    );

  /* =====================================
   * CONSENSUS FINALIZED
   * ===================================*/

  if (
    consensus.quorum.status ===
    FinalityStatus.FINALIZED
  ) {

    stateMachine.transition(
      ProtocolState.FINALIZED,
    );

    return {

      success: true,

      verification,

      execution,

      settlement,

      attestation,

      consensus,

      finalState:
        stateMachine.getState(),
    };
  }

  /* =====================================
   * CONSENSUS REJECTED
   * ===================================*/

  if (
    consensus.quorum.status ===
    FinalityStatus.REJECTED
  ) {

    stateMachine.transition(
      ProtocolState.REJECTED,
    );

    return {

      success: false,

      verification,

      execution,

      settlement,

      attestation,

      consensus,

      finalState:
        stateMachine.getState(),

      reason:
        consensus.reason,
    };
  }

  /* =====================================
   * CONSENSUS PENDING
   * ===================================*/

  return {

    success: false,

    verification,

    execution,

    settlement,

    attestation,

    consensus,

    finalState:
      stateMachine.getState(),

    reason:
      "Consensus quorum pending",
  };
}