import { Wallet } from "ethers";

export function createWallet() {
  return Wallet.createRandom();
}