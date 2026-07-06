import type {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import type {
  RequestStore,
} from "../storage/request-store.js";

import type {
  ReplayStore,
} from "../storage/replay-store.js";

import type {
  SettlementStore,
} from "../storage/settlement-store.js";

import type {
  ExecutionResult,
} from "./result.js";

import type {
  SettlementReceipt,
} from "./request-settlement.js";

import type {
  AttestationReceipt,
} from "./request-attestation.js";

import {
  ProtocolState,
} from "../state/transitions.js";

import {
  SettlementStatus,
} from "../state/settlement.js";

/* =========================================
 * PERSISTENCE OPTIONS
 * =======================================*/

/**
 * Centralized protocol
 * persistence adapters.
 *
 * This layer abstracts ALL
 * protocol storage operations.
 */
export interface PersistenceOptions {

  /**
   * Request lifecycle store.
   */
  requestStore:
    RequestStore;

  /**
   * Replay protection store.
   */
  replayStore:
    ReplayStore;

  /**
   * Settlement persistence store.
   */
  settlementStore:
    SettlementStore;
}

/* =========================================
 * PERSISTENCE ENGINE
 * =======================================*/

/**
 * Deterministic protocol
 * persistence coordinator.
 *
 * Responsible for:
 *
 * - lifecycle persistence
 * - replay tracking
 * - settlement recording
 * - audit consistency
 * - recovery support
 */
export class PersistenceEngine {

  constructor(
    private readonly options:
      PersistenceOptions,
  ) {}

  /* =====================================
   * REQUEST RECEIVED
   * ===================================*/

  /**
   * Persist newly received request.
   */
  async persistReceived(

    digest:
      HashDigest,

    envelope:
      Envelope,
  ): Promise<void> {

    await this.options
      .requestStore
      .set({

        digest,

        envelope,

        state:
          ProtocolState.RECEIVED,

        createdAt:
          Date.now(),
      });
  }

  /* =====================================
   * VERIFICATION
   * ===================================*/

  /**
   * Persist verified request.
   */
  async persistVerification(

    digest:
      HashDigest,
  ): Promise<void> {

    const request =
      await this.options
        .requestStore
        .get(digest);

    if (!request) {
      return;
    }

    await this.options
      .requestStore
      .set({

        ...request,

        state:
          ProtocolState.VERIFIED,
      });
  }

  /* =====================================
   * REPLAY TRACKING
   * ===================================*/

  /**
   * Persist replay protection state.
   */
  async persistReplay(

    digest:
      HashDigest,

    sender:
      string,

    nonce:
      number,
  ): Promise<void> {

    await this.options
      .replayStore
      .trackReplay(
        digest,
      );

    await this.options
      .replayStore
      .trackNonce(

        sender,

        nonce,
      );
  }

  /* =====================================
   * EXECUTION
   * ===================================*/

  /**
   * Persist execution result.
   */
  async persistExecution(

    execution:
      ExecutionResult,
  ): Promise<void> {

    const request =
      await this.options
        .requestStore
        .get(
          execution.digest,
        );

    if (!request) {
      return;
    }

    await this.options
      .requestStore
      .set({

        ...request,

        state:
          execution.success
            ? ProtocolState.EXECUTED
            : ProtocolState.REJECTED,

        updatedAt:
          Date.now(),
      });
  }

  /* =====================================
   * SETTLEMENT
   * ===================================*/

  /**
   * Persist settlement receipt.
   */
  async persistSettlement(

    receipt:
      SettlementReceipt,
  ): Promise<void> {

    await this.options
      .settlementStore
      .set({

        digest:
          receipt.digest,

        state:
          receipt.state,

        status:
          receipt.success
            ? SettlementStatus.SUCCESS
            : SettlementStatus.FAILURE,

        settledAt:
          receipt.settledAt,

        result:
          receipt.execution.success
            ? receipt.execution.result
            : undefined,
      });
  }

  /* =====================================
   * FINALIZATION
   * ===================================*/

  /**
   * Persist finalized protocol state.
   */
  async persistFinalization(

    digest:
      HashDigest,

    attestation?:
      AttestationReceipt,
  ): Promise<void> {

    const request =
      await this.options
        .requestStore
        .get(digest);

    if (!request) {
      return;
    }

    await this.options
      .requestStore
      .set({

        ...request,

        state:
          ProtocolState.FINALIZED,

        finalizedAt:
          Date.now(),

        metadata: {

          ...request.metadata,

          attestation,
        },
      });
  }

  /* =====================================
   * REJECTION
   * ===================================*/

  /**
   * Persist rejected request.
   */
  async persistRejection(

    digest:
      HashDigest,

    reason:
      string,
  ): Promise<void> {

    const request =
      await this.options
        .requestStore
        .get(digest);

    if (!request) {
      return;
    }

    await this.options
      .requestStore
      .set({

        ...request,

        state:
          ProtocolState.REJECTED,

        updatedAt:
          Date.now(),

        metadata: {

          ...request.metadata,

          rejectionReason:
            reason,
        },
      });
  }
}