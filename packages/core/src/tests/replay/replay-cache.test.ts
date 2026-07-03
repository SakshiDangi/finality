import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  InMemoryReplayCache,
  ReplayCacheEntry,
} from "../../replay/replay-cache.js";

describe(
  "InMemoryReplayCache",
  () => {
    let replayCache:
      InMemoryReplayCache;

    beforeEach(() => {
      replayCache =
        new InMemoryReplayCache();
    });

    /* =====================================
     * INITIAL STATE
     * ===================================*/

    it(
      "starts with empty replay state",
      () => {
        expect(
          replayCache.size(),
        ).toBe(0);
      },
    );

    /* =====================================
     * INSERTION
     * ===================================*/

    it(
      "stores replay cache entries",
      () => {
        const entry:
          ReplayCacheEntry = {
          digest:
            "0xabc123",

          createdAt:
            Date.now(),
        };

        replayCache.set(
          entry,
        );

        expect(
          replayCache.has(
            entry.digest,
          ),
        ).toBe(true);

        expect(
          replayCache.size(),
        ).toBe(1);
      },
    );

    /* =====================================
     * LOOKUP
     * ===================================*/

    it(
      "returns false for unknown digests",
      () => {
        expect(
          replayCache.has(
            "0xdeadbeef",
          ),
        ).toBe(false);
      },
    );

    /* =====================================
     * DELETION
     * ===================================*/

    it(
      "removes replay entries",
      () => {
        const entry:
          ReplayCacheEntry = {
          digest:
            "0xremove",

          createdAt:
            Date.now(),
        };

        replayCache.set(
          entry,
        );

        const deleted =
          replayCache.delete(
            entry.digest,
          );

        expect(
          deleted,
        ).toBe(true);

        expect(
          replayCache.has(
            entry.digest,
          ),
        ).toBe(false);

        expect(
          replayCache.size(),
        ).toBe(0);
      },
    );

    it(
      "returns false when deleting unknown digest",
      () => {
        const deleted =
          replayCache.delete(
            "0xmissing",
          );

        expect(
          deleted,
        ).toBe(false);
      },
    );

    /* =====================================
     * RESET
     * ===================================*/

    it(
      "clears replay state",
      () => {
        replayCache.set({
          digest:
            "0x1",

          createdAt:
            Date.now(),
        });

        replayCache.set({
          digest:
            "0x2",

          createdAt:
            Date.now(),
        });

        expect(
          replayCache.size(),
        ).toBe(2);

        replayCache.clear();

        expect(
          replayCache.size(),
        ).toBe(0);

        expect(
          replayCache.has(
            "0x1",
          ),
        ).toBe(false);

        expect(
          replayCache.has(
            "0x2",
          ),
        ).toBe(false);
      },
    );

    /* =====================================
     * DETERMINISTIC OVERWRITE
     * ===================================*/

    it(
      "overwrites existing digest deterministically",
      () => {
        replayCache.set({
          digest:
            "0xsame",

          createdAt: 1,
        });

        replayCache.set({
          digest:
            "0xsame",

          createdAt: 2,
        });

        expect(
          replayCache.size(),
        ).toBe(1);

        expect(
          replayCache.has(
            "0xsame",
          ),
        ).toBe(true);
      },
    );
  },
);