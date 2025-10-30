/**
 * Client-Side Encryption Helpers for Arcium MXE Integration
 *
 * These functions handle encryption/decryption of data for Arcium's
 * Multi-Party Execution (MXE) environment using the Rescue cipher.
 *
 * IMPORTANT: Encryption happens CLIENT-SIDE, not in the Solana program!
 */

import { PublicKey } from "@solana/web3.js";

// Note: These are placeholder implementations
// In production, install and use: npm install @arcium-hq/client
// import { RescueCipher, generateKeypair } from "@arcium-hq/client";

/**
 * Generate cryptographically secure random entropy for MPC shuffle
 *
 * Each player contributes 32 bytes of randomness to ensure
 * no single party can control the shuffle outcome.
 *
 * @returns 32 bytes of cryptographically secure random data
 */
export function generatePlayerEntropy(): Uint8Array {
  const entropy = new Uint8Array(32);

  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    window.crypto.getRandomValues(entropy);
  } else if (typeof global !== 'undefined' && global.crypto) {
    // Node.js 19+ environment
    global.crypto.getRandomValues(entropy);
  } else {
    // Fallback for older Node.js
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(32);
    entropy.set(randomBytes);
  }

  return entropy;
}

/**
 * Encrypt data for Arcium MXE using Rescue cipher
 *
 * Production implementation would use @arcium-hq/client:
 * ```typescript
 * import { RescueCipher, generateKeypair } from "@arcium-hq/client";
 *
 * const cipher = new RescueCipher();
 * const keypair = generateKeypair();
 * const nonce = crypto.getRandomValues(new Uint8Array(16));
 *
 * const ciphertext = cipher.encrypt(data, keypair.secretKey, nonce);
 * ```
 *
 * @param data - Plain data to encrypt (typically 32-byte entropy)
 * @param ownerPublicKey - Optional: encrypt to specific owner
 * @returns Encrypted data with nonce
 */
export function encryptForMxe(
  data: Uint8Array,
  ownerPublicKey?: PublicKey
): {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  owner?: PublicKey;
} {
  // Generate random nonce
  const nonce = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(nonce);
  } else if (typeof global !== 'undefined' && global.crypto) {
    global.crypto.getRandomValues(nonce);
  } else {
    const crypto = require('crypto');
    nonce.set(crypto.randomBytes(16));
  }

  // TODO: Replace with real Rescue cipher encryption
  // For now, return placeholder (mock mode)
  console.warn('[MXE] Using MOCK encryption - install @arcium-hq/client for production');

  const ciphertext = new Uint8Array(32);
  ciphertext.set(data.slice(0, 32)); // Mock: just copy data

  return {
    ciphertext,
    nonce,
    owner: ownerPublicKey,
  };
}

/**
 * Decrypt data from Arcium MXE
 *
 * Production implementation:
 * ```typescript
 * import { RescueCipher } from "@arcium-hq/client";
 *
 * const cipher = new RescueCipher();
 * const plaintext = cipher.decrypt(ciphertext, secretKey, nonce);
 * ```
 *
 * @param ciphertext - Encrypted data
 * @param nonce - Nonce used for encryption
 * @param secretKey - Secret key for decryption
 * @returns Decrypted plaintext
 */
export function decryptFromMxe(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  secretKey: Uint8Array
): Uint8Array {
  // TODO: Replace with real Rescue cipher decryption
  console.warn('[MXE] Using MOCK decryption - install @arcium-hq/client for production');

  // Mock: just return ciphertext as-is
  return ciphertext;
}

/**
 * Prepare player entropy for submission to Solana program
 *
 * Encrypts entropy and formats it as a 32-byte array for the program.
 *
 * @param entropy - Raw 32-byte entropy
 * @param playerPublicKey - Player's public key
 * @returns Formatted array for Solana program
 */
export function preparePlayerEntropyForProgram(
  entropy?: Uint8Array,
  playerPublicKey?: PublicKey
): number[] {
  // Generate entropy if not provided
  const actualEntropy = entropy || generatePlayerEntropy();

  // Encrypt for MXE
  const encrypted = encryptForMxe(actualEntropy, playerPublicKey);

  // Convert to number array for Anchor
  return Array.from(encrypted.ciphertext);
}

/**
 * Generate encrypted entropy for multiple players
 *
 * @param playerCount - Number of players contributing entropy
 * @param playerPublicKeys - Optional: array of player public keys
 * @returns Array of encrypted entropy arrays
 */
export function generateMultiPlayerEntropy(
  playerCount: number,
  playerPublicKeys?: PublicKey[]
): number[][] {
  const entropyArrays: number[][] = [];

  for (let i = 0; i < playerCount; i++) {
    const playerKey = playerPublicKeys?.[i];
    const entropy = preparePlayerEntropyForProgram(undefined, playerKey);
    entropyArrays.push(entropy);
  }

  return entropyArrays;
}

/**
 * Derive MXE account PDAs for a given cluster
 *
 * These are the accounts needed to invoke MXE computations.
 *
 * @param mxeProgramId - The deployed MXE program ID
 * @param compDefOffset - Computation definition offset (e.g., 0 for shuffle)
 * @returns Object with MXE account addresses
 */
export function deriveMxeAccounts(
  mxeProgramId: PublicKey,
  compDefOffset: number
): {
  mxeAccount: PublicKey;
  compDefAccount: PublicKey;
  mempoolAccount: PublicKey;
  clusterAccount: PublicKey;
} {
  // MXE main account
  const [mxeAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("mxe")],
    mxeProgramId
  );

  // Computation definition account
  const [compDefAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("comp_def"), Buffer.from([compDefOffset])],
    mxeProgramId
  );

  // Mempool account (for queueing computations)
  const [mempoolAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("mempool")],
    mxeProgramId
  );

  // Cluster account
  const [clusterAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("cluster")],
    mxeProgramId
  );

  return {
    mxeAccount,
    compDefAccount,
    mempoolAccount,
    clusterAccount,
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * import { generatePlayerEntropy, encryptForMxe } from "./helpers/mxe_crypto";
 *
 * // Generate entropy for player
 * const entropy = generatePlayerEntropy();
 * console.log("Generated 32 bytes of entropy");
 *
 * // Encrypt for MXE
 * const encrypted = encryptForMxe(entropy, playerPublicKey);
 *
 * // Submit to Solana program
 * await program.methods
 *   .startGame([Array.from(encrypted.ciphertext)])
 *   .accounts({ ... })
 *   .rpc();
 * ```
 */
