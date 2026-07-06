import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createIdentity,
  deriveAddress,
  derivePublicKey,
  generateKeyPair,
  generatePrivateKey,
  isValidAddress,
  isValidPrivateKey,
  isValidPublicKey,
} from "../../crypto/identity.js";

describe("generatePrivateKey()", () => {
  it("generates a valid secp256k1 private key", () => {
    const key = generatePrivateKey();

    expect(key).toMatch(
      /^0x[a-f0-9]{64}$/i,
    );

    expect(
      isValidPrivateKey(key),
    ).toBe(true);
  });

  it("generates unique keys", () => {
    const first =
      generatePrivateKey();

    const second =
      generatePrivateKey();

    expect(first).not.toBe(
      second,
    );
  });
});

describe("derivePublicKey()", () => {
  it("derives a valid public key", () => {
    const privateKey =
      generatePrivateKey();

    const publicKey =
      derivePublicKey(
        privateKey,
      );

    expect(
      isValidPublicKey(
        publicKey,
      ),
    ).toBe(true);
  });

  it("is deterministic", () => {
    const privateKey =
      generatePrivateKey();

    expect(
      derivePublicKey(
        privateKey,
      ),
    ).toBe(
      derivePublicKey(
        privateKey,
      ),
    );
  });
});

describe("generateKeyPair()", () => {
  it("creates a matching keypair", () => {
    const pair =
      generateKeyPair();

    expect(
      isValidPrivateKey(
        pair.privateKey,
      ),
    ).toBe(true);

    expect(
      isValidPublicKey(
        pair.publicKey,
      ),
    ).toBe(true);

    expect(pair.publicKey).toBe(
      derivePublicKey(
        pair.privateKey,
      ),
    );
  });

  it("generates unique keypairs", () => {
    const first =
      generateKeyPair();

    const second =
      generateKeyPair();

    expect(
      first.privateKey,
    ).not.toBe(
      second.privateKey,
    );

    expect(
      first.publicKey,
    ).not.toBe(
      second.publicKey,
    );
  });
});

describe("deriveAddress()", () => {
  it("derives a valid protocol address", () => {
    const pair =
      generateKeyPair();

    const address =
      deriveAddress(
        pair.publicKey,
      );

    expect(
      isValidAddress(
        address,
      ),
    ).toBe(true);
  });

  it("is deterministic", () => {
    const pair =
      generateKeyPair();

    expect(
      deriveAddress(
        pair.publicKey,
      ),
    ).toBe(
      deriveAddress(
        pair.publicKey,
      ),
    );
  });

  it("produces different addresses for different keys", () => {
    const first =
      generateKeyPair();

    const second =
      generateKeyPair();

    expect(
      deriveAddress(
        first.publicKey,
      ),
    ).not.toBe(
      deriveAddress(
        second.publicKey,
      ),
    );
  });
});

describe("createIdentity()", () => {
  it("creates a complete protocol identity", () => {
    const identity =
      createIdentity();

    expect(
      identity.id,
    ).toMatch(
      /^node-[a-f0-9]{12}$/i,
    );

    expect(
      isValidPublicKey(
        identity.publicKey,
      ),
    ).toBe(true);

    expect(
      isValidAddress(
        identity.address,
      ),
    ).toBe(true);
  });

  it("uses a supplied identifier", () => {
    const identity =
      createIdentity(
        "validator-01",
      );

    expect(
      identity.id,
    ).toBe(
      "validator-01",
    );
  });

  it("creates unique identities", () => {
    const first =
      createIdentity();

    const second =
      createIdentity();

    expect(first.id).not.toBe(
      second.id,
    );

    expect(
      first.publicKey,
    ).not.toBe(
      second.publicKey,
    );

    expect(
      first.address,
    ).not.toBe(
      second.address,
    );
  });
});

describe("isValidPrivateKey()", () => {
  it("accepts valid private keys", () => {
    expect(
      isValidPrivateKey(
        generatePrivateKey(),
      ),
    ).toBe(true);
  });

  it("rejects malformed keys", () => {
    expect(
      isValidPrivateKey(
        "0x1234",
      ),
    ).toBe(false);

    expect(
      isValidPrivateKey(
        "hello",
      ),
    ).toBe(false);

    expect(
      isValidPrivateKey(
        "",
      ),
    ).toBe(false);
  });
});

describe("isValidPublicKey()", () => {
  it("accepts valid public keys", () => {
    const pair =
      generateKeyPair();

    expect(
      isValidPublicKey(
        pair.publicKey,
      ),
    ).toBe(true);
  });

  it("rejects malformed public keys", () => {
    expect(
      isValidPublicKey(
        "0xdeadbeef",
      ),
    ).toBe(false);

    expect(
      isValidPublicKey(
        "invalid",
      ),
    ).toBe(false);

    expect(
      isValidPublicKey(
        "",
      ),
    ).toBe(false);
  });
});

describe("isValidAddress()", () => {
  it("accepts derived protocol addresses", () => {
    const pair =
      generateKeyPair();

    expect(
      isValidAddress(
        deriveAddress(
          pair.publicKey,
        ),
      ),
    ).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(
      isValidAddress(
        "0x1234",
      ),
    ).toBe(false);

    expect(
      isValidAddress(
        "invalid",
      ),
    ).toBe(false);

    expect(
      isValidAddress(
        "",
      ),
    ).toBe(false);
  });
});