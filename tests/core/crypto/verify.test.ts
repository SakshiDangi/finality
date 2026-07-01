import {
  describe,
  it,
  expect,
} from "vitest";

import {
  generateWallet,
} from "@/core/crypto/wallet";

import {
  signPayload,
} from "@/core/crypto/sign";

import {
  hashKeccak256,
} from "@/core/crypto/hash";

import {
  verifyPayload,
  verifyDigestSignature,
  recoverSigner,
  assertVerified,
  verificationMatches,
} from "@/core/crypto/verify";


describe("Valid Signature", () => {
  it("accepts valid signed payload", async () => {
    const wallet =
      generateWallet();

    const payload = {
      amount:100,
      receiver:"alice",
    };

    const signed =
      await signPayload(
        payload,
        wallet.privateKey
      );

    const result =
      verifyPayload(
        payload,
        signed
      );

    expect(
      result.verified
    )
    .toBe(true);

    expect(
      result.reason
    )
    .toBe("VALID");

    expect(
      result.recoveredSigner
    )
    .toBe(wallet.address);
  });
});


describe("Payload Integrity", () => {
it("rejects modified payload", async () => {
 const wallet =
   generateWallet();

 const original = {
   amount:100
 };

 const signed =
   await signPayload(
     original,
     wallet.privateKey
   );

 const modified = {
   amount:999
 };

 const result =
   verifyPayload(
     modified,
     signed
   );

 expect(
   result.verified
 )
 .toBe(false);

 expect(
   result.reason
 )
 .toBe("INVALID_DIGEST");
});
});


describe("Signer Validation", () => {
it("rejects wrong signer", async () => {
 const walletA =
   generateWallet();
 const walletB =
   generateWallet();
 const signed =
   await signPayload(
     {
       value:1
     },
     walletA.privateKey
   );
 const result =
   verifyPayload(
     {
       value:1
     },
     {
       ...signed,
       signer:
         walletB.address
     }
   );

 expect(
   result.verified
 )
 .toBe(false);

 expect(
   result.reason
 )
 .toBe("INVALID_SIGNER");
});
});


describe("Digest Tampering", () => {
it("rejects modified digest", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
     {
       data:"hello"
     },
     wallet.privateKey
   );
 const tampered = {
   ...signed,

   digest:
     hashKeccak256({
       data:"evil"
     })
 };

 const result =
   verifyPayload(
     {
       data:"hello"
     },
     tampered
   );

 expect(
   result.verified
 )
 .toBe(false);

 expect(
   result.reason
 )
 .toBe("INVALID_DIGEST");
});
});


// modify only serialized string
describe("Serialization Integrity", () => {
it("rejects changed canonical serialization", async () => {
 const wallet =
   generateWallet();

 const payload = {
   a:1,
   b:2
 };

 const signed =
   await signPayload(
     payload,
     wallet.privateKey
   );

 const tampered = {
   ...signed,
   serialized:
     JSON.stringify({
       b:2,
       a:1
     })
 };

 const result =
   verifyPayload(
     payload,
     tampered
   );

 expect(
   result.verified
 )
 .toBe(false);

 expect(
   result.reason
 )
 .toBe("INVALID_PAYLOAD");
});
});


describe("Signer Recovery", () => {
it("recovers correct signer", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
     {
       x:1
     },
     wallet.privateKey
   );

 const recovered =
   recoverSigner(
     signed.digest,
     signed.signature
   );

 expect(
   recovered
 )
 .toBe(
   wallet.address
 );
});
});


describe("Digest Verification", () => {
it("verifies digest signature", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
     {
       msg:"hello"
     },
     wallet.privateKey
   );

 const result =
   verifyDigestSignature(
     signed.digest,
     signed.signature,
     wallet.address
   );

 expect(
   result.verified
 )
 .toBe(true);
});
});


describe("Strict Verification", () => {
it("throws on failed verification", () => {
 
  expect(() =>
   assertVerified({
     verified:false,
     reason:"INVALID_SIGNATURE",
     recoveredSigner:null,
     expectedSigner:null,
     digest:null
   })
 )
 .toThrow();
});
});


describe("Verification Equality", () => {
it("compares results deterministically", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
    {
      x:1
    },
    wallet.privateKey
   );

 const a =
   verifyPayload(
    {
      x:1
    },
    signed
   );

 const b =
   verifyPayload(
    {
      x:1
    },
    signed
   );

 expect(
   verificationMatches(
     a,
     b
   )
 )
 .toBe(true);
});
});


it("prevents payload replay", async () => {
 const wallet =
   generateWallet();

 const signed =
   await signPayload(
    {
      transfer:10
    },
    wallet.privateKey
   );

 const result =
   verifyPayload(
    {
      transfer:999
    },
    signed
   );

 expect(
   result.verified
 )
 .toBe(false);
});