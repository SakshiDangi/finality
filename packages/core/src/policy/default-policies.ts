import type {
  ReplayStore,
} from "../storage/replay-store.js";

import type {
  PolicyRule,
} from "./policy-types.js";

import {
  PolicyEngine,
  type PolicyEngineOptions,
} from "./policy-engine.js";

import {
  createReplayRule,
  createNonceRule,
  createRateLimitRule,
  createAdminRule,
  createAISafetyRule,
} from "./policy-rules.js";

/* =========================================
 * DEFAULT POLICY OPTIONS
 * =======================================*/

/**
 * Production-ready default
 * governance configuration.
 *
 * Used by:
 *
 * - Slack Trust Agent
 * - Qwen agent systems
 * - CROO TrustGate
 * - secure workflow engines
 * - distributed validators
 */
export interface DefaultPolicyOptions
  extends PolicyEngineOptions {

  /**
   * Replay protection store.
   */
  replayStore:
    ReplayStore;

  /**
   * Authorized admin identities.
   */
  admins?:
    readonly string[];

  /**
   * Rate limit threshold.
   */
  rateLimit?:
    number;

  /**
   * Rate limit interval.
   */
  rateLimitWindowMs?:
    number;

  /**
   * Enable AI safety validation.
   *
   * Default:
   *   true
   */
  enableAISafety?:
    boolean;
}

/* =========================================
 * DEFAULT POLICY ENGINE
 * =======================================*/

/**
 * Creates production-ready
 * deterministic policy engine.
 *
 * Included protections:
 *
 * - replay protection
 * - nonce ordering
 * - AI safety validation
 * - admin authorization
 * - rate limiting
 *
 * This becomes the reusable
 * governance layer for ALL
 * external integrations.
 */
export function createDefaultPolicyEngine(

  options:
    DefaultPolicyOptions,
): PolicyEngine {

  const rules:
    PolicyRule[] = [];

  /* =====================================
   * REPLAY PROTECTION
   * ===================================*/

  rules.push(

    createReplayRule(
      options.replayStore,
    ),
  );

  /* =====================================
   * NONCE ORDERING
   * ===================================*/

  rules.push(

    createNonceRule(
      options.replayStore,
    ),
  );

  /* =====================================
   * RATE LIMITING
   * ===================================*/

  rules.push(

    createRateLimitRule(

      options.rateLimit ??
        10,

      options
        .rateLimitWindowMs ??
        60_000,
    ),
  );

  /* =====================================
   * ADMIN AUTHORIZATION
   * ===================================*/

  rules.push(

    createAdminRule(
      options.admins ?? [],
    ),
  );

  /* =====================================
   * AI SAFETY
   * ===================================*/

  if (
    options.enableAISafety !==
    false
  ) {

    rules.push(
      createAISafetyRule(),
    );
  }

  /* =====================================
   * CUSTOM RULES
   * ===================================*/

  if (options.rules) {

    rules.push(
      ...options.rules,
    );
  }

  /* =====================================
   * CREATE ENGINE
   * ===================================*/

  return new PolicyEngine({

    rules,
  });
}

/* =========================================
 * DEFAULT POLICY EXPORTS
 * =======================================*/

/**
 * Canonical production policy stack.
 *
 * Useful for:
 *
 * - secure Slack workflows
 * - AI orchestration systems
 * - TrustGate validation
 * - protocol governance
 * - workflow automation
 */
export const DEFAULT_POLICY_EXPORTS =
  Object.freeze({

    createReplayRule,

    createNonceRule,

    createRateLimitRule,

    createAdminRule,

    createAISafetyRule,

    createDefaultPolicyEngine,
  });