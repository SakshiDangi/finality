import {
  Wallet,
  SigningKey,
  computeAddress,
} from "ethers";

/**
 * ---------------------------------------------------------------------
 * Wallet Error
 * ---------------------------------------------------------------------
 */

export class WalletError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "WalletError";
  }
}

/**
 * ---------------------------------------------------------------------
 * Protocol Wallet Interface
 * ---------------------------------------------------------------------
 */

export interface ProtocolWallet {
  address: string;
  publicKey: string;
  privateKey: string;
}

/**
 * ---------------------------------------------------------------------
 * Address Validation
 * ---------------------------------------------------------------------
 */

export function isValidAddress(
  address: string
): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(
    address
  );
}

/**
 * ---------------------------------------------------------------------
 * Private Key Validation
 * ---------------------------------------------------------------------
 */

export function isValidPrivateKey(
  privateKey: string
): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(
    privateKey
  );
}

/**
 * ---------------------------------------------------------------------
 * Public Key Validation
 * ---------------------------------------------------------------------
 */
export function isValidPublicKey(
  publicKey: string
): boolean {
  return /^0x[a-fA-F0-9]+$/.test(
    publicKey
  );
}

/**
 * ---------------------------------------------------------------------
 * Generate Random Wallet
 * ---------------------------------------------------------------------
 * Uses:
 * cryptographically secure entropy.
 */

export function generateWallet():
  ProtocolWallet {
  try {
    const wallet =
      Wallet.createRandom();

    return {
      address: wallet.address,
      publicKey:
        SigningKey.computePublicKey(
          wallet.privateKey,
          false
        ),
      privateKey:
        wallet.privateKey,
    };
  } catch (error) {
    throw new WalletError(
      `Wallet generation failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Load Wallet From Private Key
 * ---------------------------------------------------------------------
 */

export function loadWallet(
  privateKey: string
): ProtocolWallet {
  try {
    if (
      !isValidPrivateKey(
        privateKey
      )
    ) {
      throw new WalletError(
        "Invalid private key format"
      );
    }

    const wallet =
      new Wallet(privateKey);
    return {
      address: wallet.address,
      publicKey:
        SigningKey.computePublicKey(
          wallet.privateKey,
          false
        ),
      privateKey:
        wallet.privateKey,
    };
  } catch (error) {
    throw new WalletError(
      `Wallet loading failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Derive Address From Public Key
 * ---------------------------------------------------------------------
 */

export function deriveAddress(
  publicKey: string
): string {
  try {
    if (
      !isValidPublicKey(
        publicKey
      )
    ) {
      throw new WalletError(
        "Invalid public key"
      );
    }

    return computeAddress(
      publicKey
    );
  } catch (error) {
    throw new WalletError(
      `Address derivation failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Extract Public Key
 * ---------------------------------------------------------------------
 */

export function extractPublicKey(
  privateKey: string
): string {
  try {
    if (
      !isValidPrivateKey(
        privateKey
      )
    ) {
      throw new WalletError(
        "Invalid private key"
      );
    }

    return SigningKey.computePublicKey(
      privateKey,
      false
    );
  } catch (error) {
    throw new WalletError(
      `Public key extraction failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Extract Address
 * ---------------------------------------------------------------------
 */

export function extractAddress(
  privateKey: string
): string {
  try {
    if (
      !isValidPrivateKey(
        privateKey
      )
    ) {
      throw new WalletError(
        "Invalid private key"
      );
    }

    return new Wallet(privateKey)
      .address;
  } catch (error) {
    throw new WalletError(
      `Address extraction failed: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

/**
 * ---------------------------------------------------------------------
 * Wallet Equality
 * ---------------------------------------------------------------------
 */

export function walletsEqual(
  a: ProtocolWallet,
  b: ProtocolWallet
): boolean {
  return (
    a.address.toLowerCase() ===
    b.address.toLowerCase()
  );
}

/**
 * ---------------------------------------------------------------------
 * Redacted Wallet View
 * ---------------------------------------------------------------------
 * Useful for:
 * - logs
 * - debugging
 * - audits
 * NEVER expose private keys publicly.
 */

export function redactWallet(
  wallet: ProtocolWallet
) {
  return {
    address: wallet.address,
    publicKey:
      wallet.publicKey,
    privateKey:
      "[REDACTED]",
  };
}