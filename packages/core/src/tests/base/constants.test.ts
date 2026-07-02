import { describe, expect, it } from "vitest";

import {
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_TTL_MS,
  MAX_CLOCK_DRIFT_MS,
  MAX_PACKET_AGE_MS,
  MAX_PAYLOAD_SIZE_BYTES,
  NONCE_WINDOW_SIZE,
  PROTOCOL_NAME,
  PROTOCOL_VERSION
} from "../../base/constants.js";

describe("base/constants", () => {
  it("should define protocol name", () => {
    expect(PROTOCOL_NAME).toBe("FINALITY_CORE");
  });

  it("should define protocol version", () => {
    expect(PROTOCOL_VERSION).toBe("1.0.0");
  });

  it("should define positive clock drift", () => {
    expect(MAX_CLOCK_DRIFT_MS).toBeGreaterThan(0);
  });

  it("should define positive packet age", () => {
    expect(MAX_PACKET_AGE_MS).toBeGreaterThan(0);
  });

  it("should define positive payload size", () => {
    expect(MAX_PAYLOAD_SIZE_BYTES).toBeGreaterThan(0);
  });

  it("should define positive ttl", () => {
    expect(DEFAULT_TTL_MS).toBeGreaterThan(0);
  });

  it("should define positive nonce window", () => {
    expect(NONCE_WINDOW_SIZE).toBeGreaterThan(0);
  });

  it("should define default signature algorithm", () => {
    expect(DEFAULT_SIGNATURE_ALGORITHM)
      .toBe("SECP256K1");
  });
});