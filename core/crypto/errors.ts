/**
 * ---------------------------------------------------------------------
 * Base Crypto Error
 * ---------------------------------------------------------------------
 */

export class CryptoError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "CryptoError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Serialization Error
 * ---------------------------------------------------------------------
 */

export class SerializationError
  extends CryptoError {
  constructor(message: string) {
    super(message);

    this.name =
      "SerializationError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Hashing Error
 * ---------------------------------------------------------------------
 */

export class HashingError
  extends CryptoError {
  constructor(message: string) {
    super(message);

    this.name =
      "HashingError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Wallet Error
 * ---------------------------------------------------------------------
 */

export class WalletError
  extends CryptoError {
  constructor(message: string) {
    super(message);

    this.name =
      "WalletError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Signing Error
 * ---------------------------------------------------------------------
 */

export class SigningError
  extends CryptoError {
  constructor(message: string) {
    super(message);

    this.name =
      "SigningError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Verification Error
 * ---------------------------------------------------------------------
 */

export class VerificationError
  extends CryptoError {
  constructor(message: string) {
    super(message);

    this.name =
      "VerificationError";
  }
}