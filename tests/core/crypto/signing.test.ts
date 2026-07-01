import {
  describe,
  it,
  expect,
} from "vitest";

import {
  Wallet,
} from "ethers";

import {
  signPayload,
  signDigest,
  splitSignature,
  signaturesEqual,
  normalizeSignature,
  isValidSignature,
} from "@/core/crypto/sign";

import {
  generateWallet,
} from "@/core/crypto/wallet";


// same payload -> same digest
describe("Deterministic Digest", () => {
  it("produces same digest for same payload", async () => {
    const wallet =
      generateWallet();

    const payload = {
      amount: 100,
      receiver: "alice",
    };

    const a =
      await signPayload(
        payload,
        wallet.privateKey
      );

    const b =
      await signPayload(
        payload,
        wallet.privateKey
      );

    expect(
      a.digest
    )
    .toBe(
      b.digest
    );
  });
});

// different payload -> different signature
describe("Payload Integrity", () => {
  it("different payloads produce different signatures", async () => {
    const wallet =
      generateWallet();

    const first =
      await signPayload(
        {
          amount: 100,
        },
        wallet.privateKey
      );

    const second =
      await signPayload(
        {
          amount: 200,
        },
        wallet.privateKey
      );

    expect(
      first.signature
    )
    .not
    .toBe(
      second.signature
    );
  });
});


describe("Invalid Private Keys", () => {
  it("rejects malformed private keys", async () => {
    await expect(
      signPayload(
        {
          test: true,
        },
        "0x123"
      )
    )
    .rejects
    .toThrow();
  });
});


describe("Signature Validation", () => {
  it("creates valid signature", async () => {
    const wallet =
      generateWallet();

    const signed =
      await signPayload(
        {
          hello:"world",
        },
        wallet.privateKey
      );

    expect(
      isValidSignature(
        signed.signature
      )
    )
    .toBe(true);
  });
});



// signature splitting r, s, v
describe("Signature Split", () => {
it("extracts r s v values", async () => {
  const wallet =
    generateWallet();

  const signed =
    await signPayload(
      {
        data:"test",
      },
      wallet.privateKey
    );

  const parts =
    splitSignature(
      signed.signature
    );

  expect(parts.r)
    .toBeDefined();

  expect(parts.s)
    .toBeDefined();

  expect(parts.v)
    .toBeDefined();
  });
});


describe("Canonical Ordering", () => {
it("same digest regardless of object key order", async () => {
 const wallet =
   generateWallet();

 const first =
   await signPayload(
     {
       a:1,
       b:2,
     },
     wallet.privateKey
   );

 const second =
   await signPayload(
     {
       b:2,
       a:1,
     },
     wallet.privateKey
   );

 expect(
   first.digest
 )
 .toBe(
   second.digest
 );
});
});


describe("Signature Comparison", () => {
it("compares signatures safely", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
    {
      x:1
    },
    wallet.privateKey
   );

 const upper =
   "0x" +
   signed.signature
     .slice(2)
     .toUpperCase();

 expect(
   signaturesEqual(
     signed.signature,
     upper
   )
 )
 .toBe(true);
});
});


describe("Digest Signing", () => {
it("signs raw digest", async () => {
 const wallet =
   generateWallet();

 const digest =
   "0x" +
   "a".repeat(64);

 const signature =
   await signDigest(
     digest,
     wallet.privateKey
   );

 expect(
   isValidSignature(
     signature
   )
 )
 .toBe(true);
});
});


describe("Signer Identity", () => {
it("returns correct signer address", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
    {
      message:"hello"
    },
    wallet.privateKey
   );

 expect(
   signed.signer
 )
 .toBe(
   wallet.address
 );

});
});


describe("Timestamp", () => {
it("includes signing timestamp", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
     {
       id:1
     },
     wallet.privateKey
   );

 expect(
   signed.signedAt
 )
 .toBeGreaterThan(0);
});
})

describe("Hex signatures", () => {
it("accepts mixed-case hex signatures", async () => {

  const wallet =
    generateWallet();


  const signed =
    await signPayload(
      {
        test:true
      },
      wallet.privateKey
    );


  const mixed =
    "0x" +
    signed.signature
      .slice(2)
      .toUpperCase();


  expect(
    isValidSignature(mixed)
  )
  .toBe(true);

});
})