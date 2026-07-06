import type {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
  ProtocolAddress,
} from "../base/primitives.js";

import type {
  ProtocolState,
} from "../state/transitions.js";

/* =========================================
 * POLICY EFFECT
 * =======================================*/

/**
 * Final policy decision.
 *
 * ALLOW:
 *   request may continue
 *
 * DENY:
 *   request must stop
 *
 * REVIEW:
 *   requires human approval
 *   or external validation
 */
export enum PolicyEffect {

  /**
   * Request approved.
   */
  ALLOW =
    "ALLOW",

  /**
   * Request rejected.
   */
  DENY =
    "DENY",

  /**
   * Request requires review.
   */
  REVIEW =
    "REVIEW",
}

/* =========================================
 * POLICY SEVERITY
 * =======================================*/

/**
 * Policy violation severity.
 *
 * Used for:
 *
 * - audit systems
 * - attack analysis
 * - AI governance
 * - workflow escalation
 */
export enum PolicySeverity {

  LOW =
    "LOW",

  MEDIUM =
    "MEDIUM",

  HIGH =
    "HIGH",

  CRITICAL =
    "CRITICAL",
}

/* =========================================
 * POLICY CONTEXT
 * =======================================*/

/**
 * Canonical runtime
 * policy evaluation context.
 *
 * Shared across:
 *
 * - Slack agents
 * - AI agents
 * - TrustGate
 * - workflow systems
 * - execution engines
 */
export interface PolicyContext {

  /**
   * Canonical request digest.
   */
  digest:
    HashDigest;

  /**
   * Protocol envelope.
   */
  envelope:
    Envelope;

  /**
   * Request sender.
   */
  sender:
    ProtocolAddress;

  /**
   * Request nonce.
   */
  nonce:
    number;

  /**
   * Current protocol state.
   */
  state:
    ProtocolState;

  /**
   * Runtime timestamp.
   */
  timestamp:
    number;

  /**
   * Optional execution metadata.
   */
  metadata?:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

/* =========================================
 * POLICY VIOLATION
 * =======================================*/

/**
 * Individual policy violation.
 *
 * Used for:
 *
 * - diagnostics
 * - security analysis
 * - Slack UX
 * - AI governance
 * - audit logs
 */
export interface PolicyViolation {

  /**
   * Rule identifier.
   */
  rule:
    string;

  /**
   * Human-readable reason.
   */
  reason:
    string;

  /**
   * Violation severity.
   */
  severity:
    PolicySeverity;
}

/* =========================================
 * POLICY RESULT
 * =======================================*/

/**
 * Final aggregated
 * policy evaluation result.
 */
export interface PolicyResult {

  /**
   * Final policy effect.
   */
  effect:
    PolicyEffect;

  /**
   * Overall evaluation success.
   */
  success:
    boolean;

  /**
   * Policy violations.
   */
  violations:
    readonly PolicyViolation[];

  /**
   * Aggregate risk score.
   *
   * Range:
   *   0 → 100
   */
  riskScore:
    number;

  /**
   * Human-readable reason.
   */
  reason?:
    string;
}

/* =========================================
 * POLICY RULE
 * =======================================*/

/**
 * Deterministic policy rule.
 *
 * Every rule must:
 *
 * - be deterministic
 * - produce consistent results
 * - avoid side effects
 */
export interface PolicyRule {

  /**
   * Unique rule identifier.
   */
  id:
    string;

  /**
   * Human-readable description.
   */
  description:
    string;

  /**
   * Rule evaluation.
   */
  evaluate(
    context:
      PolicyContext,
  ):
    | Promise<PolicyResult>
    | PolicyResult;
}