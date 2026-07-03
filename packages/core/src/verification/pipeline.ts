 import {
  Envelope,
} from "../base/envelope.js";

import {
  ProtocolVerificationResult,
  verifyEnvelope,
  VerifierContext,
} from "./verifier.js";

/* =========================================
 * PIPELINE STAGES
 * =======================================*/

export enum PipelineStage {
  /**
   * Envelope entered pipeline.
   */
  RECEIVED =
    "RECEIVED",

  /**
   * Verification succeeded.
   */
  VERIFIED =
    "VERIFIED",

  /**
   * Verification failed.
   */
  REJECTED =
    "REJECTED",

  /**
   * Future execution stage.
   */
  EXECUTING =
    "EXECUTING",

  /**
   * Future settlement stage.
   */
  SETTLED =
    "SETTLED",

  /**
   * Final immutable state.
   */
  FINALIZED =
    "FINALIZED",
}

/* =========================================
 * PIPELINE CONTEXT
 * =======================================*/

export interface PipelineContext {
  /**
   * Verifier runtime context.
   */
  verifier:
    VerifierContext;
}

/* =========================================
 * PIPELINE RESULT
 * =======================================*/

export interface PipelineResult {
  /**
   * Pipeline success state.
   */
  success: boolean;

  /**
   * Current pipeline stage.
   */
  stage:
    PipelineStage;

  /**
   * Verification result.
   */
  verification:
    ProtocolVerificationResult;

  /**
   * Human-readable diagnostics.
   */
  reason?: string;

  /**
   * Pipeline execution timestamp.
   */
  processedAt:
    number;
}

/* =========================================
 * VERIFICATION PIPELINE
 * =======================================*/

/**
 * Executes deterministic
 * protocol verification pipeline.
 *
 * Current flow:
 *
 * RECEIVED
 * -> VERIFIED
 * -> REJECTED
 *
 * Future flow:
 *
 * VERIFIED
 * -> replay protection
 * -> execution
 * -> settlement
 * -> finalized
 */
export function executeVerificationPipeline(
  envelope: Envelope,

  context: PipelineContext,
): PipelineResult {
  /**
   * Pipeline entry timestamp.
   */
  const processedAt =
    context.verifier.currentTime;

  /**
   * Initial pipeline state.
   */
  let stage =
    PipelineStage.RECEIVED;

  /**
   * Execute unified verification.
   */
  const verification =
    verifyEnvelope(
      envelope,
      context.verifier,
    );

  /**
   * Reject invalid envelopes.
   */
  if (
    !verification.success
  ) {
    stage =
      PipelineStage.REJECTED;

    return {
      success: false,

      stage,

      verification,

      reason:
        verification.reason,

      processedAt,
    };
  }

  /**
   * Verification succeeded.
   */
  stage =
    PipelineStage.VERIFIED;

  /**
   * Future pipeline extensions:
   *
   * - replay persistence
   * - execution engine
   * - state transitions
   * - settlement
   * - finalization
   */

  return {
    success: true,

    stage,

    verification,

    processedAt,
  };
}