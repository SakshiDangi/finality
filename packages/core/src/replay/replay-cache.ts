/* =========================================
 * REPLAY CACHE ENTRY
 * =======================================*/

/**
 * Persisted replay record.
 *
 * Stores deterministic
 * execution identity.
 */
export interface ReplayCacheEntry {
  /**
   * Deterministic message digest.
   */
  digest: string;

  /**
   * Initial execution timestamp.
   */
  createdAt: number;
}

/* =========================================
 * REPLAY CACHE CONTRACT
 * =======================================*/

/**
 * Abstract replay cache.
 *
 * Future implementations:
 *
 * - memory
 * - redis
 * - sqlite
 * - postgres
 * - distributed stores
 */
export interface ReplayCache {
  /**
   * Detect replay existence.
   */
  has(
    digest: string,
  ): boolean;

  /**
   * Persist execution digest.
   */
  set(
    entry: ReplayCacheEntry,
  ): void;

  /**
   * Remove replay entry.
   */
  delete(
    digest: string,
  ): boolean;

  /**
   * Clear replay state.
   */
  clear(): void;

  /**
   * Total replay entries.
   */
  size(): number;
}

/* =========================================
 * IN-MEMORY REPLAY CACHE
 * =======================================*/

/**
 * Deterministic in-memory
 * replay protection cache.
 *
 * Intended for:
 *
 * - local execution
 * - protocol testing
 * - MVP infrastructure
 */
export class InMemoryReplayCache
  implements ReplayCache
{
  /**
   * Internal digest store.
   */
  private readonly cache =
    new Map<
      string,
      ReplayCacheEntry
    >();

  /**
   * Detect replay digest.
   */
  has(
    digest: string,
  ): boolean {
    return this.cache.has(
      digest,
    );
  }

  /**
   * Persist replay digest.
   */
  set(
    entry: ReplayCacheEntry,
  ): void {
    this.cache.set(
      entry.digest,
      entry,
    );
  }

  /**
   * Remove replay entry.
   */
  delete(
    digest: string,
  ): boolean {
    return this.cache.delete(
      digest,
    );
  }

  /**
   * Reset replay cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Total replay entries.
   */
  size(): number {
    return this.cache.size;
  }
}