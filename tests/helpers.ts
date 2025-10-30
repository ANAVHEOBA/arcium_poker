import * as anchor from "@coral-xyz/anchor";

// Re-export MXE crypto helpers
export * from "./helpers/mxe_crypto";

/**
 * Helper function to derive Game PDA
 */
export function getGamePda(
  programId: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey,
  gameId: number | anchor.BN
): [anchor.web3.PublicKey, number] {
  const gameIdBn = typeof gameId === "number" ? new anchor.BN(gameId) : gameId;

  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("game"),
      authority.toBuffer(),
      gameIdBn.toArrayLike(Buffer, "le", 8)
    ],
    programId
  );
}

/**
 * Helper function to derive PlayerState PDA
 */
export function getPlayerStatePda(
  programId: anchor.web3.PublicKey,
  game: anchor.web3.PublicKey,
  player: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("player"),
      game.toBuffer(),
      player.toBuffer()
    ],
    programId
  );
}

/**
 * Helper function to airdrop SOL to an account
 */
export async function airdropSol(
  connection: anchor.web3.Connection,
  publicKey: anchor.web3.PublicKey,
  amount: number = 2
): Promise<void> {
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * anchor.web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);
}
