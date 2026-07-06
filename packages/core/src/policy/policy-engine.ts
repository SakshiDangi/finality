import type {
  PolicyContext,
  PolicyResult,
  PolicyRule,
} from "./policy-types.js";

import {
  mergePolicies,
  allowPolicy,
} from "./policy-result.js";

/* =========================================
 * POLICY ENGINE OPTIONS
 * =======================================*/

/**
 * Policy engine configuration.
 */
export interface PolicyEngineOptions {

  /**
   * Initial policy rules.
   */
  rules?:
    readonly PolicyRule[];
}

/* =========================================
 * POLICY ENGINE
 * =======================================*/

/**
 * Deterministic protocol
 * governance engine.
 *
 * Responsible for:
 *
 * - policy orchestration
 * - rule execution
 * - governance enforcement
 * - AI safety validation
 * - replay protection
 * - Slack workflow approval
 * - TrustGate verification
 */
export class PolicyEngine {

  /**
   * Registered policy rules.
   */
  private readonly rules =
    new Map<
      string,
      PolicyRule
    >();

  constructor(
    options?:
      PolicyEngineOptions,
  ) {

    for (
      const rule of
      options?.rules ?? []
    ) {

      this.register(
        rule,
      );
    }
  }

  /* =====================================
   * RULE MANAGEMENT
   * ===================================*/

  /**
   * Register deterministic
   * policy rule.
   */
  register(
    rule:
      PolicyRule,
  ): void {

    this.rules.set(
      rule.id,
      Object.freeze({
        ...rule,
      }),
    );
  }

  /**
   * Remove policy rule.
   */
  unregister(
    ruleId:
      string,
  ): boolean {

    return this.rules.delete(
      ruleId,
    );
  }

  /**
   * Retrieve policy rule.
   */
  getRule(
    ruleId:
      string,
  ):
    | PolicyRule
    | undefined {

    return this.rules.get(
      ruleId,
    );
  }

  /**
   * Detect registered rule.
   */
  hasRule(
    ruleId:
      string,
  ): boolean {

    return this.rules.has(
      ruleId,
    );
  }

  /**
   * Total registered rules.
   */
  size():
    number {

    return this.rules.size;
  }

  /**
   * Registered rules.
   */
  values():
    readonly PolicyRule[] {

    return [
      ...this.rules.values(),
    ];
  }

  /**
   * Registered rule IDs.
   */
  keys():
    readonly string[] {

    return [
      ...this.rules.keys(),
    ];
  }

  /**
   * Reset governance engine.
   */
  clear():
    void {

    this.rules.clear();
  }

  /* =====================================
   * POLICY EXECUTION
   * ===================================*/

  /**
   * Evaluate all registered
   * policy rules.
   *
   * Deterministic ordering:
   *
   * Rules execute in
   * registration order.
   */
  async evaluate(

    context:
      PolicyContext,
  ): Promise<
    PolicyResult
  > {

    /* ===================================
     * EMPTY RULESET
     * =================================*/

    if (
      this.rules.size === 0
    ) {

      return allowPolicy(
        "No policy rules registered",
      );
    }

    /* ===================================
     * EXECUTE RULES
     * =================================*/

    const results:
      PolicyResult[] = [];

    for (
      const rule of
      this.rules.values()
    ) {

      const result =
        await rule.evaluate(
          context,
        );

      results.push(
        Object.freeze({
          ...result,
        }),
      );
    }

    /* ===================================
     * AGGREGATE RESULTS
     * =================================*/

    return mergePolicies(
      results,
    );
  }

  /* =====================================
   * RULE EXECUTION
   * ===================================*/

  /**
   * Evaluate single rule.
   */
  async evaluateRule(

    ruleId:
      string,

    context:
      PolicyContext,
  ): Promise<
    PolicyResult
  > {

    const rule =
      this.rules.get(
        ruleId,
      );

    if (!rule) {

      return allowPolicy(
        `Rule "${ruleId}" not found`,
      );
    }

    return rule.evaluate(
      context,
    );
  }
}