import { describe, it, expect } from "vitest";
import {
  serializeCanonical,
  areCanonicallyEqual,
} from "@/core/crypto/serialization";

describe("serializeCanonical", () => {
  it("produces the same output regardless of object key order", () => {
    const objectA = {
      a: 1,
      b: 2,
    };

    const objectB = {
      b: 2,
      a: 1,
    };

    const serializedA =
      serializeCanonical(objectA);

    const serializedB =
      serializeCanonical(objectB);

    expect(serializedA).toBe(serializedB);
  });
});

describe("serializeCanonical", () => {
  it("serializes bigint deterministically", () => {
    const value = 123n;

    const result =
      serializeCanonical(value);

    expect(result).toBe('"123"');
  });
});

describe("serializeCanonical", () => {
  it("serializes the same bigint consistently", () => {
    const first = 123n;
    const second = BigInt("123");

    expect(
      serializeCanonical(first)
    ).toBe(
      serializeCanonical(second)
    )
  });
});

describe("serializeCanonical", () => {
  it("handles negative bigint", () => {
    expect(
      serializeCanonical(-123n)
    ).toBe('" -123 "'.replaceAll(" ", ""));
  });
});

describe("serializeCanonical", () => {
  it("removes undefined values from objects", () => {
    const withUndefined = {
      a: 1,
      b: undefined,
    };

    const withoutUndefined = {
      a: 1,
    };

    expect(
      serializeCanonical(withUndefined)
    ).toBe(
      serializeCanonical(withoutUndefined)
    );

  });
});

describe("serializeCanonical", () => {
it("removes undefined keys completely", () => {
  const value = {
    a: 1,
    b: undefined,
  };

  expect(
    serializeCanonical(value)
  ).toBe(
    '{"a":1}'
  );
});
});

describe("serializeCanonical", () => {
  it("preserves array ordering", () => {
    const first = [1, 2];
    const second = [2, 1];

    expect(
      serializeCanonical(first)
    ).toBe(
      "[1,2]"
    );

    expect(
      serializeCanonical(second)
    ).toBe(
      "[2,1]"
    );

    expect(
      areCanonicallyEqual(
        first,
        second
      )
    ).toBe(false);
  });
});