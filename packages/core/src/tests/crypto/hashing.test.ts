import {
  describe,
  expect,
  it,
} from "vitest";

import {
  HASH_ALGORITHM,
  hashCanonical,
  hashesEqual,
  hashString,
} from "../../crypto/hashing.js";

describe(
  "crypto/hashing",
  () => {
    it(
      "should hash string using sha256",
      () => {
        const digest =
          hashString(
            "finality",
          );

        expect(digest)
          .toMatch(
            /^0x[a-f0-9]+$/,
          );
      },
    );

    it(
      "should produce deterministic hashes",
      () => {
        const left =
          hashString(
            "hello-world",
          );

        const right =
          hashString(
            "hello-world",
          );

        expect(left)
          .toBe(right);
      },
    );

    it(
      "should produce different hashes for different values",
      () => {
        const left =
          hashString("a");

        const right =
          hashString("b");

        expect(left)
          .not
          .toBe(right);
      },
    );

    it(
      "should hash canonical objects deterministically",
      () => {
        const left =
          hashCanonical({
            amount: 100,
            asset: "USDC",
          });

        const right =
          hashCanonical({
            asset: "USDC",
            amount: 100,
          });

        expect(left)
          .toBe(right);
      },
    );

    it(
      "should support sha512 hashing",
      () => {
        const digest =
          hashString(
            "finality",
            HASH_ALGORITHM.SHA512,
          );

        expect(digest)
          .toMatch(
            /^0x[a-f0-9]+$/,
          );
      },
    );

    it(
      "should compare equal hashes correctly",
      () => {
        const left =
          hashString(
            "protocol",
          );

        const right =
          hashString(
            "protocol",
          );

        expect(
          hashesEqual(
            left,
            right,
          ),
        ).toBe(true);
      },
    );

    it(
      "should compare different hashes correctly",
      () => {
        const left =
          hashString("a");

        const right =
          hashString("b");

        expect(
          hashesEqual(
            left,
            right,
          ),
        ).toBe(false);
      },
    );

    it(
      "should hash nested canonical structures",
      () => {
        const digest =
          hashCanonical({
            settlement: {
              chainId: 1,
              asset: "ETH",
              amount: 10,
            },

            validator: {
              id: "validator-1",
            },
          });

        expect(digest)
          .toMatch(
            /^0x[a-f0-9]+$/,
          );
      },
    );

    it(
      "should produce stable digest length",
      () => {
        const digest =
          hashString(
            "finality",
          );

        /**
         * 0x + 64 hex chars
         */
        expect(
          digest.length,
        ).toBe(66);
      },
    );
  },
);