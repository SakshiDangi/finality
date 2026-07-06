import type {
  ReplayStore,
} from "../storage/replay-store.js";

import type {
  PolicyRule,
  PolicyContext,
} from "./policy-types.js";

import {
  PolicySeverity,
} from "./policy-types.js";

import {
  allowPolicy,
  denyPolicy,
  reviewPolicy,
  createViolation,
} from "./policy-result.js";

/* =========================================
 * REPLAY PROTECTION RULE
 * =======================================*/

/**
 * Creates deterministic
 * replay protection rule.
 *
 * Rejects:
 *
 * - duplicate requests
 * - replay attacks
 * - previously finalized digests
 */
export function createReplayRule(

  replayStore:
    ReplayStore,
): PolicyRule {

  return {

    id:
      "replay-protection",

    description:
      "Reject duplicate protocol requests",

    evaluate(
      context:
        PolicyContext,
    ) {

      const exists =
        replayStore.hasReplay(
          context.digest,
        );

      if (exists) {

        return denyPolicy(

          "Replay attack detected",

          [
            createViolation(

              "replay-protection",

              "Request digest already exists",

              PolicySeverity.CRITICAL,
            ),
          ],

          100,
        );
      }

      return allowPolicy(
        "Replay validation passed",
      );
    },
  };
}

/* =========================================
 * NONCE ORDERING RULE
 * =======================================*/

/**
 * Enforces deterministic
 * sender nonce ordering.
 *
 * Rejects:
 *
 * - stale nonces
 * - duplicate nonces
 * - out-of-order execution
 */
export function createNonceRule(

  replayStore:
    ReplayStore,
): PolicyRule {

  return {

    id:
      "nonce-ordering",

    description:
      "Validate sender nonce ordering",

    evaluate(
      context:
        PolicyContext,
    ) {

      const latest =
        replayStore.getLatestNonce(
          context.sender,
        );

      if (
        latest === undefined
      ) {

        return allowPolicy(
          "Initial nonce accepted",
        );
      }

      if (
        context.nonce <=
        latest
      ) {

        return denyPolicy(

          "Invalid nonce ordering",

          [
            createViolation(

              "nonce-ordering",

              `Expected nonce greater than ${latest}`,

              PolicySeverity.HIGH,
            ),
          ],

          90,
        );
      }

      return allowPolicy(
        "Nonce validation passed",
      );
    },
  };
}

/* =========================================
 * RATE LIMIT RULE
 * =======================================*/

/**
 * Simple deterministic
 * execution throttling.
 *
 * Used for:
 *
 * - Slack abuse prevention
 * - AI execution limits
 * - workflow spam control
 */
export function createRateLimitRule(

  limit:
    number,

  intervalMs:
    number,
): PolicyRule {

  const executions =
    new Map<
      PolicyContext["sender"],
      number[]
    >();

  return {

    id:
      "rate-limit",

    description:
      "Throttle excessive execution frequency",

    evaluate(
      context:
        PolicyContext,
    ) {

      const now =
        context.timestamp;

      const history =
        executions.get(
          context.sender,
        ) ?? [];

      const recent =
        history.filter(
          timestamp =>
            now - timestamp <
            intervalMs,
        );

      if (
        recent.length >=
        limit
      ) {

        return reviewPolicy(

          "Rate limit exceeded",

          [
            createViolation(

              "rate-limit",

              "Execution frequency too high",

              PolicySeverity.MEDIUM,
            ),
          ],

          70,
        );
      }

      recent.push(now);

      executions.set(
        context.sender,
        recent,
      );

      return allowPolicy(
        "Rate limit passed",
      );
    },
  };
}

/* =========================================
 * ADMIN AUTHORIZATION RULE
 * =======================================*/

/**
 * Restricts sensitive
 * protocol operations
 * to approved admins.
 *
 * Useful for:
 *
 * - payment approvals
 * - deployment workflows
 * - AI execution controls
 * - governance systems
 */
export function createAdminRule(

  admins:
    readonly string[],
): PolicyRule {

  return {

    id:
      "admin-authorization",

    description:
      "Restrict sensitive actions to admins",

    evaluate(
      context:
        PolicyContext,
    ) {

      const rawAction =
        context.envelope
          .payload.action;
      
      const action =
        typeof rawAction ===
        "string"
          ? rawAction
          : "";

      const sensitive =
        [
          "approve-payment",
          "deploy-service",
          "execute-transfer",
        ];

      if (
        !sensitive.includes(
          action,
        )
      ) {

        return allowPolicy(
          "Action does not require admin",
        );
      }

      const authorized =
        admins.includes(
          context.sender,
        );

      if (!authorized) {

        return denyPolicy(

          "Unauthorized action",

          [
            createViolation(

              "admin-authorization",

              "Sender lacks admin permissions",

              PolicySeverity.CRITICAL,
            ),
          ],

          95,
        );
      }

      return allowPolicy(
        "Admin authorization passed",
      );
    },
  };
}

/* =========================================
 * AI SAFETY RULE
 * =======================================*/

/**
 * Basic AI governance rule.
 *
 * Prevents dangerous or
 * unsafe autonomous actions.
 *
 * Extremely valuable for:
 *
 * - Qwen agents
 * - autonomous workflows
 * - AI orchestration systems
 */
export function createAISafetyRule():
  PolicyRule {

  return {

    id:
      "ai-safety",

    description:
      "Block unsafe autonomous execution",

    evaluate(
      context:
        PolicyContext,
    ) {

      const rawAction =
        context.envelope
          .payload.action;
      
      const action =
        typeof rawAction ===
        "string"
          ? rawAction.toLowerCase()
          : "";

      const blocked =
        [
          "delete-database",
          "shutdown-system",
          "wipe-storage",
          "self-replicate",
        ];

      const unsafe =
        blocked.some(
          keyword =>
            action.includes(
              keyword,
            ),
        );

      if (unsafe) {

        return denyPolicy(

          "Unsafe AI action detected",

          [
            createViolation(

              "ai-safety",

              "Dangerous autonomous action blocked",

              PolicySeverity.CRITICAL,
            ),
          ],

          100,
        );
      }

      return allowPolicy(
        "AI safety validation passed",
      );
    },
  };
}