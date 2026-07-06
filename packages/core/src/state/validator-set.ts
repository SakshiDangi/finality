import type {
  PublicKey,
} from "../base/primitives.js";

import type {
  ValidatorId,
} from "../execution/request-attestation.js";

/* =========================================
 * VALIDATOR STATUS
 * =======================================*/

/**
 * Canonical validator lifecycle.
 */
export enum ValidatorStatus {
  /**
   * Validator participates
   * in protocol consensus.
   */
  ACTIVE =
    "ACTIVE",

  /**
   * Validator temporarily
   * disabled from consensus.
   */
  INACTIVE =
    "INACTIVE",

  /**
   * Validator permanently
   * removed from trust.
   */
  SLASHED =
    "SLASHED",
}

/* =========================================
 * VALIDATOR RECORD
 * =======================================*/

/**
 * Immutable validator registry entry.
 *
 * Represents a distributed validator
 * participating in protocol consensus.
 */
export interface ValidatorRecord {
  /**
   * Canonical validator identity.
   */
  validator:
    ValidatorId;

  /**
   * Validator verification key.
   */
  publicKey:
    PublicKey;

  /**
   * Consensus voting weight.
   */
  weight:
    number;

  /**
   * Validator lifecycle state.
   */
  status:
    ValidatorStatus;

  /**
   * Registration timestamp.
   */
  createdAt:
    number;

  /**
   * Last validator update.
   */
  updatedAt:
    number;
}


/* =========================================
 * VALIDATOR REGISTRATION
 * =======================================*/

/**
 * Validator registration payload.
 */
export interface ValidatorRegistration {
  /**
   * Canonical validator identity.
   */
  validator:
    ValidatorId;

  /**
   * Validator public key.
   */
  publicKey:
    PublicKey;

  /**
   * Optional voting weight.
   */
  weight?:
    number;
}


/* =========================================
 * VALIDATOR UPDATE
 * =======================================*/

/**
 * Validator mutation payload.
 */
export interface ValidatorUpdate {
  /**
   * Updated validator weight.
   */
  weight?:
    number;

  /**
   * Updated validator status.
   */
  status?:
    ValidatorStatus;

  /**
   * Deterministic update time.
   */
  updatedAt:
    number;
}


/* =========================================
 * VALIDATOR SET RESULT
 * =======================================*/

/**
 * Validator registry operation result.
 */
export interface ValidatorSetResult {
  /**
   * Operation success state.
   */
  success:
    boolean;

  /**
   * Human-readable diagnostics.
   */
  reason?:
    string;
}


/* =========================================
 * VALIDATOR SET
 * =======================================*/

/**
 * Deterministic validator registry.
 *
 * Responsible for:
 *
 * - validator registration
 * - validator lifecycle management
 * - validator weighting
 * - consensus participation
 * - validator lookups
 * - distributed trust coordination
 */
export class ValidatorSet {
  /**
   * Internal validator registry.
   */
  private readonly validators =
    new Map<
      ValidatorId,
      ValidatorRecord
    >();
  /* =====================================
   * REGISTRATION
   * ===================================*/

  /**
   * Registers new validator.
   */
  register(
    registration:
      ValidatorRegistration,
  ): ValidatorSetResult {

    if (
      this.validators.has(
        registration.validator,
      )
    ) {
      return {
        success: false,

        reason:
          "Validator already registered",
      };
    }

    const weight =
      registration.weight ?? 1;

    if (
      weight <= 0
    ) {
      return {
        success: false,

        reason:
          "Validator weight must be positive",
      };
    }

    const now =
      Date.now();

    const record:
      ValidatorRecord = {

      validator:
        registration.validator,

      publicKey:
        registration.publicKey,

      weight,

      status:
        ValidatorStatus.ACTIVE,

      createdAt:
        now,

      updatedAt:
        now,
    };

    this.validators.set(
      registration.validator,

      Object.freeze({
        ...record,
      }),
    );

    return {
      success: true,
    };
  }
  /* =====================================
   * UPDATE
   * ===================================*/

  /**
   * Updates validator state.
   */
  update(
    validator:
      ValidatorId,

    update:
      ValidatorUpdate,
  ): ValidatorSetResult {

    const current =
      this.validators.get(
        validator,
      );

    if (
      !current
    ) {
      return {
        success: false,

        reason:
          "Validator not found",
      };
    }

    if (
      update.weight !== undefined &&
      update.weight <= 0
    ) {
      return {
        success: false,

        reason:
          "Validator weight must be positive",
      };
    }

    const next:
      ValidatorRecord = {

      ...current,

      ...update,
    };

    this.validators.set(
      validator,

      Object.freeze({
        ...next,
      }),
    );

    return {
      success: true,
    };
  }
  /* =====================================
   * REMOVAL
   * ===================================*/

  /**
   * Removes validator.
   */
  remove(
    validator:
      ValidatorId,
  ): boolean {

    return this.validators.delete(
      validator,
    );
  }
  /**
   * Total active validator weight.
   */
  totalActiveWeight():
    number {

    return this.active()
      .reduce(
        (
          total,
          validator,
        ) =>
          total +
          validator.weight,

        0,
      );
  }
  /**
   * Retrieve validator weight.
   */
  getWeight(
    validator:
      ValidatorId,
  ): number {

    return (
      this.validators.get(
        validator,
      )?.weight ?? 0
    );
  }
  
  /* =====================================
   * COLLECTIONS
   * ===================================*/

  /**
   * Total validators.
   */
  size():
    number {

    return this.validators.size;
  }

  /**
   * Retrieve all validators.
   */
  values():
    readonly ValidatorRecord[] {

    return [
      ...this.validators.values(),
    ];
  }

  /**
   * Retrieve active validators.
   */
  active():
    readonly ValidatorRecord[] {

    return this.values().filter(
      (
        validator,
      ) =>
        validator.status ===
        ValidatorStatus.ACTIVE,
    );
  }

  /**
   * Retrieve validator identities.
   */
  keys():
    readonly ValidatorId[] {

    return [
      ...this.validators.keys(),
    ];
  }

  /**
   * Reset validator registry.
   */
  clear():
    void {

    this.validators.clear();
  }
}