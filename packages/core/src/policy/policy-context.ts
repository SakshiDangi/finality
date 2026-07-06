import type {
  Envelope,
} from "../base/envelope.js";

import type {
  HashDigest,
} from "../base/primitives.js";

import {
  ProtocolState,
} from "../state/transitions.js";

import type {
  PolicyContext,
} from "./policy-types.js";

/* =========================================
 * POLICY CONTEXT INPUT
 * =======================================*/

/**
 * Raw runtime values used
 * to construct canonical
 * policy context.
 */
export interface CreatePolicyContextInput {

  /**
   * Canonical request digest.
   */
  digest:
    HashDigest;

  /**
   * Canonical envelope.
   */
  envelope:
    Envelope;

  /**
   * Optional lifecycle state.
   *
   * Defaults:
   * RECEIVED
   */
  state?:
    ProtocolState;

  /**
   * Optional timestamp.
   *
   * Defaults:
   * Date.now()
   */
  timestamp?:
    number;

  /**
   * Optional metadata.
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
 * POLICY CONTEXT CREATION
 * =======================================*/

/**
 * Creates deterministic
 * policy evaluation context.
 *
 * Used by:
 *
 * - Slack agents
 * - AI agents
 * - TrustGate
 * - workflow engines
 * - execution pipelines
 */
export function createPolicyContext(

  input:
    CreatePolicyContextInput,
): PolicyContext {

  return Object.freeze({

    digest:
      input.digest,

    envelope:
      input.envelope,

    sender:
      input.envelope.header.sender,

    nonce:
      input.envelope.header.nonce,

    state:
      input.state ??
      ProtocolState.RECEIVED,

    timestamp:
      input.timestamp ??
      Date.now(),

    metadata:
      input.metadata,
  });
}

/* =========================================
 * POLICY CONTEXT HELPERS
 * =======================================*/

/**
 * Clones existing policy context
 * with deterministic updates.
 *
 * Useful for:
 *
 * - lifecycle progression
 * - metadata injection
 * - execution updates
 * - governance escalation
 */
export function updatePolicyContext(

  context:
    PolicyContext,

  patch:
    Partial<
      Omit<
        PolicyContext,
        | "digest"
        | "envelope"
        | "sender"
        | "nonce"
      >
    >,
): PolicyContext {

  return Object.freeze({

    ...context,

    ...patch,
  });
}

/**
 * Creates policy context
 * for AI agent execution.
 *
 * Used by:
 *
 * - planner agents
 * - executor agents
 * - autonomous workflows
 * - tool orchestration
 */
export function createAgentPolicyContext(

  input:
    CreatePolicyContextInput,

  agent:
    string,
): PolicyContext {

  return createPolicyContext({

    ...input,

    metadata: {

      ...input.metadata,

      runtime:
        "agent",

      agent,
    },
  });
}

/**
 * Creates policy context
 * for Slack execution.
 *
 * Used by:
 *
 * - slash commands
 * - workflow approvals
 * - deployment requests
 * - payment approvals
 */
export function createSlackPolicyContext(

  input:
    CreatePolicyContextInput,

  channel:
    string,
): PolicyContext {

  return createPolicyContext({

    ...input,

    metadata: {

      ...input.metadata,

      runtime:
        "slack",

      channel,
    },
  });
}

/**
 * Creates policy context
 * for external agent calls.
 *
 * Used by:
 *
 * - CAP integrations
 * - CROO agents
 * - A2A systems
 * - TrustGate
 */
export function createExternalPolicyContext(

  input:
    CreatePolicyContextInput,

  source:
    string,
): PolicyContext {

  return createPolicyContext({

    ...input,

    metadata: {

      ...input.metadata,

      runtime:
        "external",

      source,
    },
  });
}