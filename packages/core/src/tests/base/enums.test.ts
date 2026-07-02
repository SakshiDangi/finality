import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MESSAGE_KIND,
  PACKET_PRIORITY,
  REQUEST_STATE,
  SIGNATURE_ALGORITHM,
  SYNCHRONIZATION_STATUS,
  VERIFICATION_STATUS,
} from "../../base/enums.js";

describe("base/enums", () => {
  it("should define request message kind", () => {
    expect(MESSAGE_KIND.REQUEST)
      .toBe("REQUEST");
  });

  it("should define response message kind", () => {
    expect(MESSAGE_KIND.RESPONSE)
      .toBe("RESPONSE");
  });

  it("should define accepted request state", () => {
    expect(REQUEST_STATE.ACCEPTED)
      .toBe("ACCEPTED");
  });

  it("should define rejected request state", () => {
    expect(REQUEST_STATE.REJECTED)
      .toBe("REJECTED");
  });

  it("should define verification status", () => {
    expect(VERIFICATION_STATUS.VALID)
      .toBe("VALID");
  });

  it("should define secp256k1 algorithm", () => {
    expect(
      SIGNATURE_ALGORITHM.SECP256K1,
    ).toBe("SECP256K1");
  });

  it("should define ed25519 algorithm", () => {
    expect(
      SIGNATURE_ALGORITHM.ED25519,
    ).toBe("ED25519");
  });

  it("should define packet priority", () => {
    expect(
      PACKET_PRIORITY.CRITICAL,
    ).toBe("CRITICAL");
  });

  it("should define synchronization status", () => {
    expect(
      SYNCHRONIZATION_STATUS.SYNCING,
    ).toBe("SYNCING");
  });
});