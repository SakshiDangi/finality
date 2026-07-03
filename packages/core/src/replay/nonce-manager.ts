import { ProtocolAddress } from "../crypto/identity.js";

/* =========================================
 * NONCE STATE
 * =======================================*/

export interface NonceState {
  sender: ProtocolAddress;
  nonce: number;
  updatedAt: number;
}

/* =========================================
 * NONCE MANAGER INTERFACE
 * =======================================*/

export interface NonceManager {
  getNonce(sender: ProtocolAddress): number;

  setNonce(state: NonceState): void;

  hasSender(sender: ProtocolAddress): boolean;

  deleteSender(sender: ProtocolAddress): boolean;

  clear(): void;

  size(): number;
}

/* =========================================
 * IN-MEMORY IMPLEMENTATION
 * =======================================*/

export class InMemoryNonceManager implements NonceManager {
  private store: Map<ProtocolAddress, NonceState> = new Map();

  getNonce(sender: ProtocolAddress): number {
    return this.store.get(sender)?.nonce ?? 0;
  }

  setNonce(state: NonceState): void {
    this.store.set(state.sender, state);
  }

  hasSender(sender: ProtocolAddress): boolean {
    return this.store.has(sender);
  }

  deleteSender(sender: ProtocolAddress): boolean {
    return this.store.delete(sender);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}