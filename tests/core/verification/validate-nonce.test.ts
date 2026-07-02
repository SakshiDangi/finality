import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateNonce,
} from "@/core/verification/validate-nonce";

import {
  MIN_NONCE,
  MAX_NONCE,
} from "@/core/verification/constants";

import {
  ReplayValidationError,
} from "@/core/verification/errors";

import type {
  ReplayValidationState,
} from "@/core/verification/types";

describe("validateNonce()", () => {
  describe("Valid Nonce", () => {
    it("should accept a valid nonce without replay state", () => {
      const result = validateNonce({
        nonce: 1,
      });

      expect(result.valid).toBe(true);
      expect(result.reason).toBe("VALID");
      expect(result.stage).toBe("NONCE");
      expect(result.severity).toBe("INFO");
      expect(result.message).toBe(
        "Nonce validation succeeded"
      );
      expect(typeof result.validatedAt).toBe(
        "number"
      );
    });

    it("should accept MIN_NONCE", () => {
      expect(() =>
        validateNonce({
          nonce: MIN_NONCE,
        })
      ).not.toThrow();
    });

    it("should accept MAX_NONCE", () => {
      expect(() =>
        validateNonce({
          nonce: MAX_NONCE,
        })
      ).not.toThrow();
    });

    it("should accept a nonce greater than the previous nonce", () => {
      const replayState: ReplayValidationState = {
        sender: "validator-1",
        nonce: 50,
        processed: true,
      };

      expect(() =>
        validateNonce({
          nonce: 51,
          replayState,
        })
      ).not.toThrow();
    });

    it("should return a fully populated ValidationResult", () => {
      const result = validateNonce({
        nonce: 100,
      });

      expect(result).toMatchObject({
        valid: true,
        reason: "VALID",
        stage: "NONCE",
        severity: "INFO",
        message: "Nonce validation succeeded",
      });

      expect(result.validatedAt).toBeGreaterThan(0);
    });
  });

  describe("Missing Nonce Validation", () => {
    it("should reject undefined nonce", () => {
      expect(() =>
        validateNonce({
          nonce: undefined,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject null nonce", () => {
      expect(() =>
        validateNonce({
          nonce: null,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should throw MISSING_NONCE reason for undefined nonce", () => {
      try {
        validateNonce({
          nonce: undefined,
        });

        expect.fail(
          "Expected ReplayValidationError to be thrown"
        );
      } catch (error) {
        expect(error).toBeInstanceOf(
          ReplayValidationError
        );

        expect(
          (error as ReplayValidationError).reason
        ).toBe("MISSING_NONCE");

        expect(
          (error as ReplayValidationError).stage
        ).toBe("NONCE");

        expect(
          (error as ReplayValidationError).severity
        ).toBe("CRITICAL");

        expect(
          (error as ReplayValidationError).message
        ).toBe("Nonce is required");
      }
    });
  });

  describe("Invalid Type Validation", () => {
    it("should reject string nonce", () => {
      expect(() =>
        validateNonce({
          nonce: "123",
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject floating point nonce", () => {
      expect(() =>
        validateNonce({
          nonce: 10.5,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject NaN", () => {
      expect(() =>
        validateNonce({
          nonce: Number.NaN,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject Infinity", () => {
      expect(() =>
        validateNonce({
          nonce: Number.POSITIVE_INFINITY,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject negative Infinity", () => {
      expect(() =>
        validateNonce({
          nonce: Number.NEGATIVE_INFINITY,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject bigint", () => {
      expect(() =>
        validateNonce({
          nonce: BigInt(100),
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject boolean true", () => {
      expect(() =>
        validateNonce({
          nonce: true,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject boolean false", () => {
      expect(() =>
        validateNonce({
          nonce: false,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject object", () => {
      expect(() =>
        validateNonce({
          nonce: {},
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject array", () => {
      expect(() =>
        validateNonce({
          nonce: [],
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject function", () => {
      expect(() =>
        validateNonce({
          nonce: (() => 1) as unknown,
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject Symbol", () => {
      expect(() =>
        validateNonce({
          nonce: Symbol("nonce"),
        })
      ).toThrow(ReplayValidationError);
    });

    it("should reject Date object", () => {
      expect(() =>
        validateNonce({
          nonce: new Date(),
        })
      ).toThrow(ReplayValidationError);
    });

    it("should throw INVALID_NONCE reason for invalid type", () => {
      try {
        validateNonce({
          nonce: "1",
        });

        expect.fail(
          "Expected ReplayValidationError"
        );
      } catch (error) {
        expect(error).toBeInstanceOf(
          ReplayValidationError
        );

        expect(
          (error as ReplayValidationError).reason
        ).toBe("INVALID_NONCE");

        expect(
          (error as ReplayValidationError).stage
        ).toBe("NONCE");

        expect(
          (error as ReplayValidationError).severity
        ).toBe("CRITICAL");

        expect(
          (error as ReplayValidationError).message
        ).toBe(
          "Nonce must be an integer"
        );
      }
    });
  });
  describe("Bounds Validation", () => {
  it("should reject a nonce smaller than MIN_NONCE", () => {
    expect(() =>
      validateNonce({
        nonce: MIN_NONCE - 1,
      })
    ).toThrow(ReplayValidationError);
  });

  it("should reject a nonce greater than MAX_NONCE", () => {
    expect(() =>
      validateNonce({
        nonce: MAX_NONCE + 1,
      })
    ).toThrow(ReplayValidationError);
  });

  it("should throw INVALID_NONCE when nonce is below minimum", () => {
    try {
      validateNonce({
        nonce: MIN_NONCE - 1,
      });

      expect.fail("Expected ReplayValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ReplayValidationError);

      const replayError =
        error as ReplayValidationError;

      expect(replayError.reason).toBe(
        "INVALID_NONCE"
      );

      expect(replayError.message).toBe(
        `Nonce must be >= ${MIN_NONCE}`
      );

      expect(replayError.stage).toBe(
        "NONCE"
      );

      expect(replayError.severity).toBe(
        "CRITICAL"
      );
    }
  });

  it("should throw INVALID_NONCE when nonce exceeds maximum", () => {
    try {
      validateNonce({
        nonce: MAX_NONCE + 1,
      });

      expect.fail("Expected ReplayValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ReplayValidationError);

      const replayError =
        error as ReplayValidationError;

      expect(replayError.reason).toBe(
        "INVALID_NONCE"
      );

      expect(replayError.message).toBe(
        `Nonce exceeds maximum allowed value ${MAX_NONCE}`
      );
    }
  });
});

describe("Replay Detection", () => {
  it("should reject an already processed nonce", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 42,
      processed: true,
    };

    expect(() =>
      validateNonce({
        nonce: 42,
        replayState,
      })
    ).toThrow(ReplayValidationError);
  });

  it("should throw REPLAY_DETECTED for an already processed nonce", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 100,
      processed: true,
    };

    try {
      validateNonce({
        nonce: 100,
        replayState,
      });

      expect.fail("Expected ReplayValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(
        ReplayValidationError
      );

      const replayError =
        error as ReplayValidationError;

      expect(replayError.reason).toBe(
        "REPLAY_DETECTED"
      );

      expect(replayError.stage).toBe(
        "NONCE"
      );

      expect(replayError.severity).toBe(
        "CRITICAL"
      );

      expect(replayError.message).toBe(
        "Nonce 100 has already been processed"
      );
    }
  });

  it("should allow the same nonce if it has not been processed and monotonic validation is disabled", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 50,
      processed: false,
    };

    expect(() =>
      validateNonce({
        nonce: 50,
        replayState,
        requireMonotonic: false,
      })
    ).not.toThrow();
  });

  it("should allow a greater nonce even if previous nonce was processed", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 90,
      processed: true,
    };

    expect(() =>
      validateNonce({
        nonce: 91,
        replayState,
      })
    ).not.toThrow();
  });

  it("should ignore replay detection when replay state is undefined", () => {
    expect(() =>
      validateNonce({
        nonce: 999,
      })
    ).not.toThrow();
  });
});

describe("Monotonic Ordering", () => {
  it("should reject a nonce smaller than the previous nonce", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 20,
      processed: false,
    };

    expect(() =>
      validateNonce({
        nonce: 19,
        replayState,
      })
    ).toThrow(ReplayValidationError);
  });

  it("should reject a nonce equal to the previous nonce", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 20,
      processed: false,
    };

    expect(() =>
      validateNonce({
        nonce: 20,
        replayState,
      })
    ).toThrow(ReplayValidationError);
  });

  it("should throw INVALID_NONCE when nonce is not monotonic", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 25,
      processed: false,
    };

    try {
      validateNonce({
        nonce: 24,
        replayState,
      });

      expect.fail("Expected ReplayValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(
        ReplayValidationError
      );

      const replayError =
        error as ReplayValidationError;

      expect(replayError.reason).toBe(
        "INVALID_NONCE"
      );

      expect(replayError.message).toBe(
        "Nonce 24 must be greater than previous nonce 25"
      );
    }
  });

  it("should accept a nonce greater than the previous nonce", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 25,
      processed: false,
    };

    expect(() =>
      validateNonce({
        nonce: 26,
        replayState,
      })
    ).not.toThrow();
  });

  it("should allow a lower nonce when requireMonotonic is false", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 100,
      processed: false,
    };

    expect(() =>
      validateNonce({
        nonce: 50,
        replayState,
        requireMonotonic: false,
      })
    ).not.toThrow();
  });

  it("should allow an equal nonce when requireMonotonic is false and nonce has not been processed", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 200,
      processed: false,
    };

    expect(() =>
      validateNonce({
        nonce: 200,
        replayState,
        requireMonotonic: false,
      })
    ).not.toThrow();
  });

  it("should still reject a replay when requireMonotonic is false", () => {
    const replayState: ReplayValidationState = {
      sender: "validator-1",
      nonce: 300,
      processed: true,
    };

    expect(() =>
      validateNonce({
        nonce: 300,
        replayState,
        requireMonotonic: false,
      })
    ).toThrow(ReplayValidationError);
  });
});
describe("Additional Security & Regression Tests", () => {
  it("should accept zero when MIN_NONCE is zero", () => {
    expect(() =>
      validateNonce({
        nonce: 0,
      })
    ).not.toThrow();
  });

  it("should accept Number.MAX_SAFE_INTEGER", () => {
    expect(() =>
      validateNonce({
        nonce: Number.MAX_SAFE_INTEGER,
      })
    ).not.toThrow();
  });

  it("should reject Number.MIN_SAFE_INTEGER", () => {
    expect(() =>
      validateNonce({
        nonce: Number.MIN_SAFE_INTEGER,
      })
    ).toThrow(ReplayValidationError);
  });

  it("should preserve validation metadata on success", () => {
    const before = Date.now();

    const result = validateNonce({
      nonce: 10,
    });

    const after = Date.now();

    expect(result.validatedAt).toBeGreaterThanOrEqual(
      before
    );

    expect(result.validatedAt).toBeLessThanOrEqual(
      after
    );
  });

  it("should produce deterministic results for identical valid inputs", () => {
    const first = validateNonce({
      nonce: 100,
    });

    const second = validateNonce({
      nonce: 100,
    });

    expect(first.valid).toBe(second.valid);
    expect(first.reason).toBe(second.reason);
    expect(first.stage).toBe(second.stage);
    expect(first.severity).toBe(second.severity);
    expect(first.message).toBe(second.message);
  });
});
});