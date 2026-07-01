import { describe, it, expect } from "vitest";

import {
  hashKeccak256,
  hashSha256,
  hash,
  isValidHash,
  createHashFingerprint,
  hashesEqual,
  hashToBytes,
  bytesToHash,
} from "@/core/crypto/hash";

describe("Deterministic Hashing", () => {
  it("hashes objects identically regardless of key order", () => {
    const first = {
      a: 1,
      b: 2,
    };
    const second = {
      b: 2,
      a: 1,
    };

    const hash1 =
      hashKeccak256(first);
    const hash2 =
      hashKeccak256(second);
    expect(hash1).toBe(hash2);
  });
});

describe("Array ordering", () => {
  it("keeps array ordering during hashing", () => {
    const first = [1,2];
    const second = [2,1];
   
    const hash1 =
      hashKeccak256(first);
    const hash2 =
      hashKeccak256(second);
   
    expect(hash1)
      .not
      .toBe(hash2);
  });
});

describe("BigInt stability", () => {
  it("hashes bigint deterministically", () => { 
    const a = 123n;
    const b = BigInt("123");
   
    const hash1 =
      hashKeccak256(a); 
    const hash2 =
      hashKeccak256(b);
   
    expect(hash1)
      .toBe(hash2); 
  });
});

describe("Hash Validation", () => {
    it("accepts valid hashes", () => {
        const valid =
          "0x" +
          "a".repeat(64);

        expect(
            isValidHash(valid)
        )
        .toBe(true);
    });
});

describe("Hash Validation", () => {
    it("rejects malformed hashes", () => {
        const invalid = [
            "",
            "123",
            "0xZZZ",
            "0x" + "a".repeat(63),
            "0x" + "a".repeat(65),
        ];
        for (const value of invalid) {
            expect(
                isValidHash(value)
            )
            .toBe(false);
        }
    });
});

describe("Fingerprint Stability", () => {
  it("creates stable fingerprints", () => {
    const payload = {
      amount: 100,
      user: "alice",
    };
    const first =
      createHashFingerprint(payload);
  
    const second =
      createHashFingerprint(payload);
  
    expect(first.canonical)
      .toBe(second.canonical);
  
    expect(first.digest)
      .toBe(second.digest); 
  
    expect(first.algorithm)
      .toBe(second.algorithm);
  });
});

describe("SHA256 and Keccak produce different algorithms", () => {
  it("supports multiple algorithms", () => {
    const value = {
      a:1
    }; 
    const keccak =
      hash(value,"keccak256");
    const sha =
      hash(value,"sha256");
   
    expect(keccak)
      .not
      .toBe(sha);
  });
});

describe("case-insensitive hash comparison", () => {
   it("compares hashes safely", () => {
    const a =
      "0xABCDEF";  
    const b =
      "0xabcdef";
   
    expect(
      hashesEqual(a,b)
    )
    .toBe(true);
   });
});

describe("hash bytes cycle", () => {
   it("converts hash bytes correctly", () => {  
    const original =
      hashKeccak256({
        test:true
      });
    const bytes =
      hashToBytes(original);  
    const rebuilt =
      bytesToHash(bytes);
 
    expect(rebuilt)
      .toBe(original);  
   });
});