import type {
  ExecutionEvent,
} from "./events.js";

import {
  ExecutionEventType,
} from "./events.js";

/* =========================================
 * METRICS SNAPSHOT
 * =======================================*/

/**
 * Immutable protocol metrics snapshot.
 */
export interface MetricsSnapshot {

  /**
   * Total protocol requests.
   */
  totalRequests:
    number;

  /**
   * Successful executions.
   */
  successfulExecutions:
    number;

  /**
   * Failed executions.
   */
  failedExecutions:
    number;

  /**
   * Finalized requests.
   */
  finalizedRequests:
    number;

  /**
   * Rejected requests.
   */
  rejectedRequests:
    number;

  /**
   * Replay attacks detected.
   */
  replayAttacks:
    number;

  /**
   * Consensus finalized count.
   */
  consensusFinalized:
    number;

  /**
   * Consensus rejected count.
   */
  consensusRejected:
    number;

  /**
   * Consensus pending count.
   */
  consensusPending:
    number;

  /**
   * Average execution duration.
   */
  averageExecutionMs:
    number;

  /**
   * Protocol throughput.
   *
   * Requests per second.
   */
  throughput:
    number;

  /**
   * Metrics timestamp.
   */
  timestamp:
    number;
}

/* =========================================
 * EXECUTION TIMER
 * =======================================*/

/**
 * Internal execution timing state.
 */
interface ExecutionTimer {

  startedAt:
    number;

  completedAt?:
    number;
}

/* =========================================
 * METRICS ENGINE
 * =======================================*/

/**
 * Deterministic protocol
 * metrics engine.
 *
 * Responsible for:
 *
 * - performance tracking
 * - validator monitoring
 * - throughput analysis
 * - latency measurement
 * - execution analytics
 * - observability
 */
export class MetricsEngine {

  /**
   * Request counters.
   */
  private totalRequests =
    0;

  private successfulExecutions =
    0;

  private failedExecutions =
    0;

  private finalizedRequests =
    0;

  private rejectedRequests =
    0;

  private replayAttacks =
    0;

  private consensusFinalized =
    0;

  private consensusRejected =
    0;

  private consensusPending =
    0;

  /**
   * Execution timers.
   */
  private readonly timers =
    new Map<
      string,
      ExecutionTimer
    >();

  /**
   * Recorded execution durations.
   */
  private readonly durations:
    number[] = [];

  /**
   * Metrics engine start time.
   */
  private readonly startedAt =
    Date.now();

  /* =====================================
   * RECORD EVENT
   * ===================================*/

  /**
   * Consume protocol event
   * and update metrics.
   */
  record(
    event:
      ExecutionEvent,
  ): void {

    switch (event.type) {

      /* ===============================
       * REQUESTS
       * =============================*/

      case ExecutionEventType
        .REQUEST_RECEIVED:

        this.totalRequests++;
        break;

      /* ===============================
       * EXECUTION START
       * =============================*/

      case ExecutionEventType
        .EXECUTION_STARTED:

        this.timers.set(
          event.digest,
          {
            startedAt:
              event.timestamp,
          },
        );

        break;

      /* ===============================
       * EXECUTION SUCCESS
       * =============================*/

      case ExecutionEventType
        .EXECUTION_COMPLETED: {

        this.successfulExecutions++;

        const timer =
          this.timers.get(
            event.digest,
          );

        if (timer) {

          timer.completedAt =
            event.timestamp;

          this.durations.push(
            timer.completedAt -
            timer.startedAt,
          );
        }

        break;
      }

      /* ===============================
       * EXECUTION FAILURE
       * =============================*/

      case ExecutionEventType
        .EXECUTION_FAILED:

        this.failedExecutions++;
        break;

      /* ===============================
       * FINALIZATION
       * =============================*/

      case ExecutionEventType
        .CONSENSUS_FINALIZED:

        this.consensusFinalized++;
        this.finalizedRequests++;
        break;

      /* ===============================
       * REJECTION
       * =============================*/

      case ExecutionEventType
        .REQUEST_REJECTED:

        this.rejectedRequests++;
        break;

      case ExecutionEventType
        .CONSENSUS_REJECTED:

        this.consensusRejected++;
        break;

      case ExecutionEventType
        .CONSENSUS_PENDING:

        this.consensusPending++;
        break;
    }
  }

  /* =====================================
   * REPLAY ATTACK
   * ===================================*/

  /**
   * Record replay attack detection.
   */
  recordReplayAttack():
    void {

    this.replayAttacks++;
  }

  /* =====================================
   * AVERAGE LATENCY
   * ===================================*/

  /**
   * Compute average execution latency.
   */
  private computeAverageExecution():
    number {

    if (
      this.durations.length === 0
    ) {

      return 0;
    }

    const total =
      this.durations.reduce(

        (
          acc,
          value,
        ) =>
          acc + value,

        0,
      );

    return total /
      this.durations.length;
  }

  /* =====================================
   * THROUGHPUT
   * ===================================*/

  /**
   * Requests per second.
   */
  private computeThroughput():
    number {

    const runtimeMs =
      Date.now() -
      this.startedAt;

    if (runtimeMs <= 0) {
      return 0;
    }

    return (
      this.totalRequests /
      (runtimeMs / 1000)
    );
  }

  /* =====================================
   * SNAPSHOT
   * ===================================*/

  /**
   * Retrieve immutable
   * metrics snapshot.
   */
  snapshot():
    Readonly<
      MetricsSnapshot
    > {

    return Object.freeze({

      totalRequests:
        this.totalRequests,

      successfulExecutions:
        this.successfulExecutions,

      failedExecutions:
        this.failedExecutions,

      finalizedRequests:
        this.finalizedRequests,

      rejectedRequests:
        this.rejectedRequests,

      replayAttacks:
        this.replayAttacks,

      consensusFinalized:
        this.consensusFinalized,

      consensusRejected:
        this.consensusRejected,

      consensusPending:
        this.consensusPending,

      averageExecutionMs:
        this.computeAverageExecution(),

      throughput:
        this.computeThroughput(),

      timestamp:
        Date.now(),
    });
  }

  /* =====================================
   * RESET METRICS
   * ===================================*/

  /**
   * Reset runtime metrics.
   */
  reset():
    void {

    this.totalRequests = 0;

    this.successfulExecutions = 0;

    this.failedExecutions = 0;

    this.finalizedRequests = 0;

    this.rejectedRequests = 0;

    this.replayAttacks = 0;

    this.consensusFinalized = 0;

    this.consensusRejected = 0;

    this.consensusPending = 0;

    this.timers.clear();

    this.durations.length = 0;
  }
}