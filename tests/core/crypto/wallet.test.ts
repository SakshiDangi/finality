import {
  describe,
  it,
  expect,
} from "vitest";

import {
  generateWallet,
  deriveAddress,
  extractPublicKey,
  loadWallet,
  walletsEqual,
  isValidPrivateKey,
  isValidAddress,
  isValidPublicKey,
} from "@/core/crypto/wallet";

describe("Wallet Generation", () => {
  it("generates a complete wallet", () => {
    const wallet =
      generateWallet();

    expect(wallet.address)
      .toBeDefined();

    expect(wallet.publicKey)
      .toBeDefined();

    expect(wallet.privateKey)
      .toBeDefined();

    expect(wallet.address.length)
      .toBeGreaterThan(0);

    expect(wallet.publicKey.length)
      .toBeGreaterThan(0);

    expect(wallet.privateKey.length)
      .toBeGreaterThan(0);
  });
});

// generated public key -> same address
describe("Address Derivation", () => {
  it("derives the same address from public key", () => {
    const wallet =
      generateWallet();

    const derived =
      deriveAddress(
        wallet.publicKey
      );

    expect(derived)
      .toBe(wallet.address);
  });
});

// private key -> public key -> address
describe("Public Key Extraction", () => {
  it("extracts public key that matches address", () => {
    const wallet =
      generateWallet();

    const extracted =
      extractPublicKey(
        wallet.privateKey
      );

    expect(extracted)
      .toBe(wallet.publicKey);

    const address =
      deriveAddress(
        extracted
      );

    expect(address)
      .toBe(wallet.address);
  });
});

//  /^0x[a-fA-F0-9]{64}$/
describe("Invalid Private Keys", () => {
  it("rejects malformed private keys", () => {
    const invalidKeys = [
      "",
      "12345",
      "0x123",
      "0xZZZZ",
      "0x" + "a".repeat(63),
      "0x" + "a".repeat(65),
    ];

    for (
      const key of invalidKeys
    ) {
      expect(
        isValidPrivateKey(key)
      )
      .toBe(false);
    }
  });
});

describe("loading fails", () => {
it("fails loading invalid wallet", () => {
  expect(() =>
    loadWallet("0x123")
  )
  .toThrow();
});
})

describe("Wallet Equality", () => {
  it("compares addresses case-insensitively", () => {
    const walletA = {
      address:
        "0xAbCdEf1234567890abcdef1234567890abcdef12",
      publicKey:
        "0xabc",
      privateKey:
        "0xprivate",
    };

    const walletB = {
      address:
        "0xabcdef1234567890ABCDEF1234567890ABCDEF12",
      publicKey:
        "0xdifferent",
      privateKey:
        "0xdifferent",
    };

    expect(
      walletsEqual(
        walletA,
        walletB
      )
    )
    .toBe(true);
  });
});

describe("Unique wallet generation", () => {
  it("generates unique wallets", () => {  
    const a =
      generateWallet();
    const b =
      generateWallet();
  
    expect(
      a.address
    )
    .not
    .toBe(
      b.address
    );
  });
});

describe("Validation Helpers", () => {
   it("validates generated wallet fields", () => {
    const wallet =
      generateWallet();
    
      expect(
      isValidAddress(wallet.address)
    )
    .toBe(true);
     
    expect(
      isValidPrivateKey(wallet.privateKey)
    )
    .toBe(true);
   
    expect(
      isValidPublicKey(wallet.publicKey)
    )
    .toBe(true);
   });
});