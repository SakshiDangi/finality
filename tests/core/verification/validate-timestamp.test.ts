import { describe, expect, it } from "vitest";

import {
  validateTimestamp,
  isFreshTimestamp,
  getTimestampAge,
} from "@/core/verification/validate-timestamp";

import {
  MAX_CLOCK_SKEW_MS,
  MAX_FUTURE_DRIFT_MS,
} from "@/core/verification/constants";

import {
  TimestampValidationError,
} from "@/core/verification/errors";


// valid timestamp
describe("validateTimestamp", () => {
  it("accepts the current timestamp", () => {
    const now = 1_700_000_000_000;

    const result = validateTimestamp(now, {
      now,
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBe("VALID");
    expect(result.stage).toBe("TIMESTAMP");
    expect(result.severity).toBe("INFO");
    expect(result.validatedAt).toBe(now);
  });
});


// missing timestamp
describe("Missing Timestamp", () => {
  it("rejects undefined", () => {
    expect(() =>
      validateTimestamp(undefined)
    ).toThrow(TimestampValidationError);
  });

  it("rejects null", () => {
    expect(() =>
      validateTimestamp(null)
    ).toThrow(TimestampValidationError);
  });
});


// invalid timestamp types
describe("Invalid Timestamp Types", () => {
  it.each([
    "1700000000000",
    NaN,
    Infinity,
    -Infinity,
    {},
    [],
    true,
    false,
  ])("rejects %p", (value) => {
    expect(() =>
      validateTimestamp(value)
    ).toThrow(TimestampValidationError);
  });
});


// stale timestamp
describe("Stale Timestamp", () => {
  it("rejects timestamps older than the allowed skew", () => {
    const now = 1_700_000_000_000;

    expect(() =>
      validateTimestamp(
        now - MAX_CLOCK_SKEW_MS - 1,
        { now }
      )
    ).toThrow(TimestampValidationError);
  });
});


// future timestamp
describe("Future Timestamp", () => {
  it("rejects timestamps beyond the allowed future drift", () => {
    const now = 1_700_000_000_000;

    expect(() =>
      validateTimestamp(
        now + MAX_FUTURE_DRIFT_MS + 1,
        { now }
      )
    ).toThrow(TimestampValidationError);
  });
});


// deterministic time
describe("Deterministic Time", () => {
  it("uses the supplied now option", () => {
    const now = 123456789;

    const result = validateTimestamp(now, {
      now,
    });

    expect(result.validatedAt).toBe(now);
  });
});


// boundary conditions IMPORTANT
describe("Boundary Conditions", () => {
  it("accepts timestamps exactly at max clock skew", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now - MAX_CLOCK_SKEW_MS,
        { now }
      )
    ).not.toThrow();
  });

  it("accepts timestamps exactly at max future drift", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now + MAX_FUTURE_DRIFT_MS,
        { now }
      )
    ).not.toThrow();
  });
});


// custom limits
describe("Custom Validation Limits", () => {
  it("uses a custom clock skew", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now - 5000,
        {
          now,
          maxClockSkewMs: 10000,
        }
      )
    ).not.toThrow();
  });

  it("uses a custom future drift", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now + 5000,
        {
          now,
          maxFutureDriftMs: 10000,
        }
      )
    ).not.toThrow();
  });
});


// custom limits
describe("Custom Validation Limits", () => {
  it("uses a custom clock skew", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now - 5000,
        {
          now,
          maxClockSkewMs: 10000,
        }
      )
    ).not.toThrow();
  });

  it("uses a custom future drift", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now + 5000,
        {
          now,
          maxFutureDriftMs: 10000,
        }
      )
    ).not.toThrow();
  });
});


// fresh timestamp helper
describe("isFreshTimestamp", () => {
  it("returns true for a fresh timestamp", () => {
    const timestamp = Date.now();

    expect(
      isFreshTimestamp(timestamp)
    ).toBe(true);
  });

  it("returns false for a stale timestamp", () => {
    const timestamp =
      Date.now() -
      MAX_CLOCK_SKEW_MS -
      100;

    expect(
      isFreshTimestamp(timestamp)
    ).toBe(false);
  });
});


// timestamp age
describe("getTimestampAge", () => {
  it("calculates timestamp age", () => {
    expect(
      getTimestampAge(7000, 10000)
    ).toBe(3000);
  });

  it("returns zero when timestamps are equal", () => {
    expect(
      getTimestampAge(10000, 10000)
    ).toBe(0);
  });

  it("returns a negative value for future timestamps", () => {
    expect(
      getTimestampAge(11000, 10000)
    ).toBe(-1000);
  });
});


// verify error reasons
describe("Error Reasons", () => {
  it("returns MISSING_TIMESTAMP", () => {
    try {
      validateTimestamp(undefined);
    } catch (error) {
      expect(error)
        .toBeInstanceOf(TimestampValidationError);

      expect(
        (error as TimestampValidationError).reason
      ).toBe("MISSING_TIMESTAMP");
    }
  });

  it("returns INVALID_TIMESTAMP", () => {
    try {
      validateTimestamp(NaN);
    } catch (error) {
      expect(
        (error as TimestampValidationError).reason
      ).toBe("INVALID_TIMESTAMP");
    }
  });

  it("returns STALE_TIMESTAMP", () => {
    const now = 100000;

    try {
      validateTimestamp(
        now - MAX_CLOCK_SKEW_MS - 1,
        { now }
      );
    } catch (error) {
      expect(
        (error as TimestampValidationError).reason
      ).toBe("STALE_TIMESTAMP");
    }
  });

  it("returns FUTURE_TIMESTAMP", () => {
    const now = 100000;

    try {
      validateTimestamp(
        now + MAX_FUTURE_DRIFT_MS + 1,
        { now }
      );
    } catch (error) {
      expect(
        (error as TimestampValidationError).reason
      ).toBe("FUTURE_TIMESTAMP");
    }
  });
});


// advance stale limit: It ensures that validator accepts timestamps that are just inside the allowed window.
describe("Clock Skew Boundary", () => {
  it("accepts a timestamp one millisecond before becoming stale", () => {
    const now = 1_700_000_000_000;

    expect(() =>
      validateTimestamp(
        now - MAX_CLOCK_SKEW_MS + 1,
        { now }
      )
    ).not.toThrow();
  });
});


// advance future drift limit
describe("Future Drift Boundary", () => {
  it("accepts a timestamp one millisecond below the future drift limit", () => {
    const now = 1_700_000_000_000;

    expect(() =>
      validateTimestamp(
        now + MAX_FUTURE_DRIFT_MS - 1,
        { now }
      )
    ).not.toThrow();
  });
});


// timestamp equal to current time
describe("Current Timestamp", () => {
  it("accepts a timestamp equal to now", () => {
    const now = 123456789;

    expect(() =>
      validateTimestamp(now, {
        now,
      })
    ).not.toThrow();
  });
});


// zero timestamp : check how validator treats the Unix epoch.
describe("Epoch Timestamp", () => {
  it("rejects an old epoch timestamp", () => {
    const now = Date.now();

    expect(() =>
      validateTimestamp(0, {
        now,
      })
    ).toThrow(TimestampValidationError);
  });
});


// negative timestamp
describe("Negative Timestamp", () => {
  it("rejects negative timestamps", () => {
    const now = Date.now();

    expect(() =>
      validateTimestamp(-1, {
        now,
      })
    ).toThrow(TimestampValidationError);
  });
});


// very large finite number
describe("Large Timestamp", () => {
  it("rejects extremely large timestamps", () => {
    const now = 1000;

    expect(() =>
      validateTimestamp(
        Number.MAX_SAFE_INTEGER,
        { now }
      )
    ).toThrow(TimestampValidationError);
  });
});


// custom clock skew rejects correctly
describe("Custom Clock Skew", () => {
  it("rejects timestamps outside the custom clock skew", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now - 5001,
        {
          now,
          maxClockSkewMs: 5000,
        }
      )
    ).toThrow(TimestampValidationError);
  });
});


// custom future drift rejects correctly
describe("Custom Future Drift", () => {
  it("rejects timestamps outside the custom future drift", () => {
    const now = 100000;

    expect(() =>
      validateTimestamp(
        now + 5001,
        {
          now,
          maxFutureDriftMs: 5000,
        }
      )
    ).toThrow(TimestampValidationError);
  });
});


// fresh timestamp at boundary
describe("isFreshTimestamp Boundary", () => {
  it("returns true at the exact freshness limit", () => {
    const timestamp =
      Date.now() - MAX_CLOCK_SKEW_MS;

    expect(
      isFreshTimestamp(timestamp)
    ).toBe(true);
  });
});


// fresh timestamp with custom age
describe("isFreshTimestamp Custom Age", () => {
  it("uses a custom maximum age", () => {
    const timestamp =
      Date.now() - 5000;

    expect(
      isFreshTimestamp(
        timestamp,
        10000
      )
    ).toBe(true);

    expect(
      isFreshTimestamp(
        timestamp,
        1000
      )
    ).toBe(false);
  });
});


// future timestamp age
describe("getTimestampAge Future", () => {
  it("returns negative age for future timestamps", () => {
    expect(
      getTimestampAge(
        2000,
        1000
      )
    ).toBe(-1000);
  });
});


// deterministic validation result: validation returns structured object, verifying the full object for consistency
describe("Validation Result", () => {
  it("returns a stable validation result", () => {
    const now = 123456;

    expect(
      validateTimestamp(now, {
        now,
      })
    ).toEqual({
      valid: true,
      reason: "VALID",
      stage: "TIMESTAMP",
      severity: "INFO",
      validatedAt: now,
      message:
        "Timestamp validation succeeded",
    });
  });
});


// repeated validation
describe("Deterministic Behaviour", () => {
  it("returns identical results for identical inputs", () => {
    const now = 100000;

    const first =
      validateTimestamp(now, {
        now,
      });

    const second =
      validateTimestamp(now, {
        now,
      });

    expect(first).toEqual(second);
  });
});


// floating-point timestamp
describe("Floating Point Timestamp", () => {
  it("accepts finite floating-point timestamps", () => {
    const now = 1000000;

    expect(() =>
      validateTimestamp(
        now - 0.5,
        { now }
      )
    ).not.toThrow();
  });
});