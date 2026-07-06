import {
  PolicyEffect,
  PolicySeverity,

  type PolicyResult,
  type PolicyViolation,
} from "./policy-types.js";

/* =========================================
 * POLICY RESULT HELPERS
 * =======================================*/

/**
 * Creates successful
 * ALLOW result.
 */
export function allowPolicy(
  reason?:
    string,

  riskScore =
    0,
): PolicyResult {

  return Object.freeze({

    success: true,

    effect:
      PolicyEffect.ALLOW,

    violations: [],

    riskScore,

    reason,
  });
}

/**
 * Creates rejected
 * DENY result.
 */
export function denyPolicy(

  reason:
    string,

  violations:
    readonly PolicyViolation[] = [],

  riskScore =
    100,
): PolicyResult {

  return Object.freeze({

    success: false,

    effect:
      PolicyEffect.DENY,

    violations,

    riskScore,

    reason,
  });
}

/**
 * Creates REVIEW result.
 *
 * Used when:
 *
 * - human approval required
 * - elevated permissions needed
 * - AI execution uncertain
 * - governance escalation triggered
 */
export function reviewPolicy(

  reason:
    string,

  violations:
    readonly PolicyViolation[] = [],

  riskScore =
    50,
): PolicyResult {

  return Object.freeze({

    success: false,

    effect:
      PolicyEffect.REVIEW,

    violations,

    riskScore,

    reason,
  });
}

/* =========================================
 * VIOLATION HELPERS
 * =======================================*/

/**
 * Creates deterministic
 * policy violation.
 */
export function createViolation(

  rule:
    string,

  reason:
    string,

  severity:
    PolicySeverity,
): PolicyViolation {

  return Object.freeze({

    rule,

    reason,

    severity,
  });
}

/* =========================================
 * RISK AGGREGATION
 * =======================================*/

/**
 * Aggregates policy risk scores.
 *
 * Result is normalized
 * to range:
 *
 * 0 → 100
 */
export function aggregateRisk(

  results:
    readonly PolicyResult[],
): number {

  if (
    results.length === 0
  ) {
    return 0;
  }

  const total =
    results.reduce(

      (
        sum,
        result,
      ) =>
        sum +
        result.riskScore,

      0,
    );

  return Math.min(
    100,

    Math.floor(
      total /
      results.length,
    ),
  );
}

/* =========================================
 * POLICY MERGING
 * =======================================*/

/**
 * Aggregates multiple
 * policy results into
 * a single deterministic
 * decision.
 *
 * Rules:
 *
 * - DENY overrides ALL
 * - REVIEW overrides ALLOW
 * - ALL ALLOW => ALLOW
 */
export function mergePolicies(

  results:
    readonly PolicyResult[],
): PolicyResult {

  if (
    results.length === 0
  ) {

    return allowPolicy(
      "No policy rules registered",
    );
  }

  const violations =
    results.flatMap(
      result =>
        result.violations,
    );

  const riskScore =
    aggregateRisk(
      results,
    );

  /* =====================================
   * DENY OVERRIDES ALL
   * ===================================*/

  const denied =
    results.find(
      result =>
        result.effect ===
        PolicyEffect.DENY,
    );

  if (denied) {

    return denyPolicy(

      denied.reason ??
        "Policy denied",

      violations,

      riskScore,
    );
  }

  /* =====================================
   * REVIEW OVERRIDES ALLOW
   * ===================================*/

  const review =
    results.find(
      result =>
        result.effect ===
        PolicyEffect.REVIEW,
    );

  if (review) {

    return reviewPolicy(

      review.reason ??
        "Policy review required",

      violations,

      riskScore,
    );
  }

  /* =====================================
   * FINAL ALLOW
   * ===================================*/

  return allowPolicy(
    "All policy rules passed",

    riskScore,
  );
}